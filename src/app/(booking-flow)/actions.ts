"use server";

import { Booking } from "@/lib/types";
import {
    checkRangeSlotAvailability,
    getStartOfDayInTimeZone,
    parseAvailability,
    parseSettings,
    parseTimeStringToDate,
    roundUp15,
} from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { addDays } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";

/**
 * Retrieves available booking dates (calculated in the client's timezone) for either lounge or station bookings.
 *
 * @param {string} timezone - The client's IANA timezone (e.g. "America/New_York").
 * @param {string} [stationId] - The station identifier (optional). If omitted, lounge dates are returned.
 * @returns {Promise<Date[]>} A promise that resolves to an array of available Date objects.
 */
export async function getAvailableDates(
    timezone: string,
    stationId?: string
): Promise<Date[]> {
    const supabase = await createClient();

    // Compute the start-of-day in the client's timezone.
    const startDate = getStartOfDayInTimeZone(new Date(), timezone);
    // Also, get the client's current local time (for today comparisons).
    const now = new Date();
    const localNow = toZonedTime(now, timezone);
    console.log("Timezone:", timezone);
    console.log("Client start of day (UTC):", startDate);
    console.log(
        "Client current time:",
        format(localNow, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: timezone })
    );

    // Fetch booking settings.
    const { data: settingsRows, error: settingsError } = await supabase
        .from("settings")
        .select()
        .in("key", [
            "lounge_max_days_in_advance",
            "station_max_days_in_advance",
            "lounge_min_booking_minutes",
            "station_min_booking_minutes",
        ]);
    if (settingsError || !settingsRows) {
        console.error("Error fetching settings:", settingsError);
        return [];
    }
    const settingsMap = parseSettings(settingsRows);
    console.log("Settings:", settingsMap);

    // Delegate to the appropriate branch.
    return stationId
        ? await getStationAvailableDates(
            stationId,
            settingsMap,
            startDate,
            timezone,
            localNow
        )
        : await getLoungeAvailableDates(settingsMap, startDate, timezone, localNow);
}

/**
 * Retrieves available dates for lounge bookings.
 *
 * @param {Record<string, string>} settingsMap - A map of booking settings.
 * @param {Date} startDate - The client’s start-of-day (as a UTC Date).
 * @param {string} timezone - The client's timezone.
 * @param {Date} localNow - The current time in the client's timezone.
 * @returns {Promise<Date[]>} A promise that resolves to an array of available lounge Date objects.
 */
async function getLoungeAvailableDates(
    settingsMap: Record<string, string>,
    startDate: Date,
    timezone: string,
    localNow: Date
): Promise<Date[]> {
    const supabase = await createClient();
    const availableDates: Date[] = [];
    const maxDaysAdvance = parseInt(
        settingsMap["lounge_max_days_in_advance"] ?? "30",
        10
    );
    const minBookingDuration = parseInt(
        settingsMap["lounge_min_booking_minutes"] ?? "30",
        10
    );
    const endDate = addDays(startDate, maxDaysAdvance);

    // Fetch global lounge availability schedules.
    const { data: rawAvailability, error: availabilityError } = await supabase
        .from("availability_schedules")
        .select("weekday, open_time, close_time")
        .eq("type", "global_lounge");
    if (availabilityError || !rawAvailability) {
        console.error("Error fetching availability schedules:", availabilityError);
        return [];
    }
    const availability = parseAvailability(rawAvailability);

    // Fetch approved lounge bookings within the date range.
    const { data: bookingsData, error: bookingsError } = await supabase
        .from("lounge_bookings")
        .select()
        .eq("status", "approved")
        .gte("start_timestamp", startDate.toISOString())
        .lte("start_timestamp", endDate.toISOString());
    if (bookingsError || !bookingsData) {
        console.error("Error fetching bookings:", bookingsError);
        return [];
    }
    const bookings = bookingsData.map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp),
    }));

    // For each day, check if there's at least one available slot.
    for (let i = 0; i < maxDaysAdvance; i++) {
        const currentDate = addDays(startDate, i);
        // Determine the weekday using the client's timezone.
        const localCurrent = toZonedTime(currentDate, timezone);
        const weekday = localCurrent.getDay();
        if (!availability[weekday]) continue;

        // Parse the day's open/close times (availability times are stored for America/Halifax,
        // but we pass the client's timezone to parse them as if they are local).
        let dayStart = parseTimeStringToDate(currentDate, availability[weekday].open, timezone);
        const dayEnd = parseTimeStringToDate(currentDate, availability[weekday].close, timezone);

        // If today and current time is later than open time, start from the next available block.
        if (i === 0 && localNow > dayStart) {
            dayStart = roundUp15(localNow);
            if (localNow >= dayEnd) continue;
        }

        const isSlotAvailable = await checkRangeSlotAvailability(
            bookings,
            dayStart,
            dayEnd,
            minBookingDuration
        );
        if (isSlotAvailable) {
            availableDates.push(currentDate);
        }
    }
    return availableDates;
}

/**
 * Retrieves available dates for station bookings.
 *
 * Station-specific availability is used if available, falling back to global station availability.
 *
 * @param {string} stationId - The station identifier.
 * @param {Record<string, string>} settingsMap - A map of booking settings.
 * @param {Date} startDate - The client’s start-of-day (as a UTC Date).
 * @param {string} timezone - The client's timezone.
 * @param {Date} localNow - The current time in the client's timezone.
 * @returns {Promise<Date[]>} A promise that resolves to an array of available station Date objects.
 */
async function getStationAvailableDates(
    stationId: string,
    settingsMap: Record<string, string>,
    startDate: Date,
    timezone: string,
    localNow: Date
): Promise<Date[]> {
    const supabase = await createClient();
    const availableDates: Date[] = [];
    const maxDaysAdvance = parseInt(
        settingsMap["station_max_days_in_advance"] ?? "30",
        10
    );
    const minBookingDuration = parseInt(
        settingsMap["station_min_booking_minutes"] ?? "30",
        10
    );
    const endDate = addDays(startDate, maxDaysAdvance);

    // Fetch global station availability schedules.
    const { data: globalAvailabilityData, error: globalAvailabilityError } = await supabase
        .from("availability_schedules")
        .select("weekday, open_time, close_time")
        .eq("type", "global_station");
    if (globalAvailabilityError || !globalAvailabilityData) {
        console.error("Error fetching global availability schedules:", globalAvailabilityError);
        return [];
    }

    // Fetch station-specific availability schedules.
    const { data: stationAvailabilityData, error: stationAvailabilityError } = await supabase
        .from("availability_schedules")
        .select("weekday, open_time, close_time")
        .eq("type", "station")
        .eq("station_id", stationId);
    if (stationAvailabilityError) {
        console.error("Error fetching station availability schedules:", stationAvailabilityError);
    }

    const availability = parseAvailability(stationAvailabilityData ?? [], globalAvailabilityData);
    console.log("Availability:", availability);

    // Fetch approved lounge bookings (affecting all stations).
    const { data: loungeBookingsData, error: loungeBookingsError } = await supabase
        .from("lounge_bookings")
        .select()
        .eq("status", "approved")
        .gte("start_timestamp", startDate.toISOString())
        .lte("start_timestamp", endDate.toISOString());

    // Fetch station bookings for the given station.
    const { data: stationBookingsData, error: stationBookingsError } = await supabase
        .from("station_bookings")
        .select()
        .eq("station_id", stationId)
        .neq("status", "cancelled")
        .gte("start_timestamp", startDate.toISOString())
        .lte("start_timestamp", endDate.toISOString());
    if (
        loungeBookingsError ||
        stationBookingsError ||
        !loungeBookingsData ||
        !stationBookingsData
    ) {
        console.error("Error fetching bookings:", loungeBookingsError, stationBookingsError);
        return [];
    }
    const bookings = [...loungeBookingsData, ...stationBookingsData].map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp),
    }));
    console.log("Bookings:", bookings);

    for (let i = 0; i < maxDaysAdvance; i++) {
        const currentDate = addDays(startDate, i);
        const localCurrent = toZonedTime(currentDate, timezone);
        const weekday = localCurrent.getDay();
        if (!availability[weekday]) continue;

        let dayStart = parseTimeStringToDate(currentDate, availability[weekday].open, timezone);
        const dayEnd = parseTimeStringToDate(currentDate, availability[weekday].close, timezone);
        if (i === 0 && localNow > dayStart) {
            dayStart = roundUp15(localNow);
            if (localNow > dayEnd) continue;
        }
        const isSlotAvailable = await checkRangeSlotAvailability(
            bookings,
            dayStart,
            dayEnd,
            minBookingDuration
        );
        if (isSlotAvailable) {
            availableDates.push(currentDate);
        }
        console.log("------------");
        console.log("Current date:", currentDate);
        console.log("Weekday:", weekday);
        console.log("Day start:", format(dayStart, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: timezone }));
        console.log("Day end:", format(dayEnd, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: timezone }));
        console.log("Available:", isSlotAvailable);
    }
    return availableDates;
}


/**
 * Retrieves all available starting times (in the client's timezone) for a given date and (optionally) station.
 *
 * If the selected date is today, the function starts from the next available 15-minute block after now,
 * ensuring that no past or current times are returned.
 *
 * @param {string} clientTimezone - The client's IANA timezone (e.g. "America/New_York").
 * @param {Date} selectedDate - The selected date.
 * @param {string} [stationId] - Optional station identifier. If provided, station availability and bookings are used.
 * @returns {Promise<Date[]>} A promise that resolves to an array of available start times (as Date objects, in the client's timezone).
 */
export async function getAvailableStartTimes(
    clientTimezone: string,
    selectedDate: Date,
    stationId?: string
): Promise<Date[]> {
    const supabase = await createClient();

    // Convert the selectedDate into the client's timezone.
    // (Even though Date objects don't store timezone info, toZonedTime will interpret the date as in UTC and then show its "wall clock" time in the target zone.)
    const selectedDateClient = toZonedTime(selectedDate, clientTimezone);
    const weekday = selectedDateClient.getDay();

    // Fetch minimum booking duration from settings.
    const settingsKey = stationId ? "station_min_booking_minutes" : "lounge_min_booking_minutes";
    const { data: settingsRows, error: settingsError } = await supabase
        .from("settings")
        .select()
        .in("key", [settingsKey]);
    if (settingsError || !settingsRows) {
        console.error("Error fetching settings:", settingsError);
        return [];
    }
    const settingsMap = parseSettings(settingsRows);
    const minBookingDuration = parseInt(settingsMap[settingsKey] ?? "15", 10);

    // Fetch availability schedules.
    let availabilityData;
    if (stationId) {
        const { data: stationAvailabilityData, error: stationAvailabilityError } = await supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time")
            .eq("type", "station")
            .eq("station_id", stationId);
        if (stationAvailabilityError) {
            console.error("Error fetching station availability:", stationAvailabilityError);
        }
        const { data: globalAvailabilityData, error: globalAvailabilityError } = await supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time")
            .eq("type", "global_station");
        if (globalAvailabilityError || !globalAvailabilityData) {
            console.error("Error fetching global station availability:", globalAvailabilityError);
            return [];
        }
        availabilityData = parseAvailability(stationAvailabilityData ?? [], globalAvailabilityData);
    } else {
        const { data: loungeAvailabilityData, error: loungeAvailabilityError } = await supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time")
            .eq("type", "global_lounge");
        if (loungeAvailabilityError || !loungeAvailabilityData) {
            console.error("Error fetching lounge availability:", loungeAvailabilityError);
            return [];
        }
        availabilityData = parseAvailability(loungeAvailabilityData);
    }

    if (!availabilityData[weekday]) {
        return [];
    }

    // Determine the day's open and close times in UTC.
    // parseTimeStringToDate converts the given date and time string (interpreted in clientTimezone) into a UTC Date.
    let dayStartUtc = parseTimeStringToDate(selectedDate, availabilityData[weekday].open, clientTimezone);
    const dayEndUtc = parseTimeStringToDate(selectedDate, availabilityData[weekday].close, clientTimezone);

    // Determine if the selected date is today in the client's timezone.
    const nowUtc = new Date();
    const nowClient = toZonedTime(nowUtc, clientTimezone);
    const isToday = selectedDateClient.toDateString() === nowClient.toDateString();

    // Set the initial candidate start time.
    let candidateStartTimeUtc = dayStartUtc.getTime();
    if (isToday) {
        // Round up the client's current time to the next 15-minute block.
        const roundedNow = roundUp15(nowClient);
        // Start from the later of the day's open time or roundedNow.
        candidateStartTimeUtc = Math.max(dayStartUtc.getTime(), roundedNow.getTime());
    }

    // Fetch bookings for the selected day using dayStartUtc and dayEndUtc as boundaries.
    let bookings: Booking[] = [];
    if (stationId) {
        const { data: loungeBookingsData, error: loungeBookingsError } = await supabase
            .from("lounge_bookings")
            .select()
            .eq("status", "approved")
            .gte("start_timestamp", dayStartUtc.toISOString())
            .lte("start_timestamp", dayEndUtc.toISOString());
        const { data: stationBookingsData, error: stationBookingsError } = await supabase
            .from("station_bookings")
            .select()
            .eq("station_id", stationId)
            .neq("status", "cancelled")
            .gte("start_timestamp", dayStartUtc.toISOString())
            .lte("start_timestamp", dayEndUtc.toISOString());
        if (loungeBookingsError || stationBookingsError || !loungeBookingsData || !stationBookingsData) {
            console.error("Error fetching bookings");
            return [];
        }
        bookings = [...loungeBookingsData, ...stationBookingsData].map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));
    } else {
        const { data: bookingsData, error: bookingsError } = await supabase
            .from("lounge_bookings")
            .select()
            .eq("status", "approved")
            .gte("start_timestamp", dayStartUtc.toISOString())
            .lte("start_timestamp", dayEndUtc.toISOString());
        if (bookingsError || !bookingsData) {
            console.error("Error fetching lounge bookings:", bookingsError);
            return [];
        }
        bookings = bookingsData.map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));
    }

    // Iterate over candidate start times in 15-minute increments until there's not enough time left.
    const availableStartTimes: Date[] = [];
    const intervalMs = 15 * 60 * 1000;
    const latestCandidateTime = dayEndUtc.getTime() - minBookingDuration * 60 * 1000;

    for (
        let candidateTime = candidateStartTimeUtc;
        candidateTime <= latestCandidateTime;
        candidateTime += intervalMs
    ) {
        const candidateStartUtc = new Date(candidateTime);
        const candidateEndUtc = new Date(candidateTime + minBookingDuration * 60 * 1000);
        const slotAvailable = await checkRangeSlotAvailability(
            bookings,
            candidateStartUtc,
            candidateEndUtc,
            minBookingDuration
        );
        if (slotAvailable) {
            // Convert candidate start time from UTC to client's timezone for display.
            const candidateStartClient = toZonedTime(candidateStartUtc, clientTimezone);
            availableStartTimes.push(candidateStartClient);
        }
    }

    return availableStartTimes;
}

// export async function getAvailableTimes(date: Date, stationId?: string): Promise<Date[] | null> {
//     const supabase = await createClient();
//     const availableSlots: Date[] = [];
//     const currentDay = startOfDay(date);
//     const weekday = currentDay.getDay(); // 0=Sun, 6=Sat
//     const now = new Date();

//     // if stationId is passed in, get unavailable times for that station
//     const isStationBooking = !!stationId;

//     let dayStart: Date;
//     let dayEnd: Date;

//     if (isStationBooking) {
//         // get station availability
//         const { data: station, error } = await supabase.from('stations').select('availability').eq('id', stationId).single();
//         if (error || !station) {
//             return null;
//         }

//         dayStart = parseTimeStringToDate(currentDay, station.availability[weekday].open);
//         dayEnd = parseTimeStringToDate(currentDay, station.availability[weekday].close);

//         if (now > dayStart) dayStart = roundUp15(now);
//     } else {
//         // If no stationId is provided, return an empty array or handle as needed
//         return availableSlots;
//     }

//     // fetch all bookings for that date and station
//     const { data, error } = await supabase
//         .from("bookings")
//         .select()
//         .eq('station_id', stationId)
//         .lte("end_timestamp", dayEnd.toISOString());

//     if (error || !data) {
//         return null;
//     }

//     const bookings = data.map((b: Booking) => ({
//         ...b,
//         start_timestamp: new Date(b.start_timestamp),
//         end_timestamp: new Date(b.end_timestamp),
//     }));

//     // Each interval is 15 minutes
//     const chunkMs = 15 * 60 * 1000;

//     let slotStart = new Date(dayStart);

//     // How many consecutive 15-min chunks do we need?
//     const requiredChunks = MIN_BOOKING_DURATION / 15;

//     while (slotStart < dayEnd) {
//         const slotEnd = new Date(slotStart.getTime() + chunkMs);

//         // If the slot would go past dayEnd, we can't fit a full 15-min chunk
//         if (slotEnd > dayEnd) break;

//         // Check if we have enough consecutive free slots starting at this time
//         let consecutiveFree = 0;
//         let checkSlot = new Date(slotStart);
//         let isSlotAvailable = true;

//         while (consecutiveFree < requiredChunks) {
//             const checkEnd = new Date(checkSlot.getTime() + chunkMs);

//             // If checking future slots would go past dayEnd, this slot isn't viable
//             if (checkEnd > dayEnd) {
//                 isSlotAvailable = false;
//                 break;
//             }

//             // Check if this specific time slot overlaps with any booking
//             const isBlocked = bookings.some(booking =>
//                 checkSlot < booking.end_timestamp &&
//                 checkEnd > booking.start_timestamp
//             );

//             if (isBlocked) {
//                 isSlotAvailable = false;
//                 break;
//             }

//             consecutiveFree++;
//             checkSlot = checkEnd;
//         }

//         if (isSlotAvailable) {
//             availableSlots.push(new Date(slotStart));
//         }

//         // Move to the next 15-minute chunk
//         slotStart = slotEnd;
//     }

//     return availableSlots;
// }