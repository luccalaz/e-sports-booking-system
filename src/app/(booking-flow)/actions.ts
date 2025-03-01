"use server";

import { Booking } from "@/lib/types";
import {
    checkRangeSlotAvailability,
    parseAvailability,
    parseSettings,
    parseTimeStringToDate,
    roundUp15,
    tzStartOfDay
} from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { addDays } from "date-fns";
// Import date-fns-tz functions
import { toZonedTime } from "date-fns-tz";

/**
 * Retrieves available booking dates (adjusted to the client's timezone) for either lounge or station bookings.
 * If stationId is provided, it uses station-specific logic (falling back to global station availability);
 * otherwise, it uses lounge availability.
 *
 * @param {string} timezone
 * @param {string} [stationId] - The station identifier (optional). If omitted, lounge dates are returned.
 * @returns {Promise<Date[]>} A promise that resolves to an array of available Date objects.
 */
export async function getAvailableDates(timezone: string, stationId?: string): Promise<Date[]> {
    const supabase = await createClient();
    const now = new Date();
    // Convert current UTC time to client's local time
    const localNow = toZonedTime(now, timezone);
    // Compute the start of day in the client's timezone as a UTC Date
    const startDate = await tzStartOfDay(localNow, timezone);

    console.log("Timezone: ", timezone)
    console.log("Local now:", localNow);
    console.log("Start date:", startDate);

    // Fetch booking settings
    const { data: settingsRows, error: settingsError } = await supabase
        .from("settings")
        .select()
        .in("key", [
            "lounge_max_days_in_advance",
            "station_max_days_in_advance",
            "lounge_min_booking_minutes",
            "station_min_booking_minutes"
        ]);
    if (settingsError || !settingsRows) {
        console.error("Error fetching settings:", settingsError);
        return [];
    }
    const settingsMap = parseSettings(settingsRows);
    console.log("Settings:", settingsMap)

    // Delegate to the appropriate branch.
    return stationId
        ? await getStationAvailableDates(stationId, settingsMap, startDate, localNow, timezone)
        : await getLoungeAvailableDates(settingsMap, startDate, localNow, timezone);
}

/**
 * Retrieves available dates for lounge bookings in the client's timezone time.
 *
 * @param {Record<string, string>} settingsMap - A map of booking settings.
 * @param {Date} startDate - The start of day (in the client's timezone) as a UTC Date.
 * @param {Date} localNow - The current time in the client's timezone.
 * @param {string} timezone - The client's timezone
 * @returns {Promise<Date[]>} A promise that resolves to an array of available lounge Date objects.
 */
async function getLoungeAvailableDates(
    settingsMap: Record<string, string>,
    startDate: Date,
    localNow: Date,
    timezone: string
): Promise<Date[]> {
    const supabase = await createClient();

    const availableDates: Date[] = [];
    const maxDaysAdvance = parseInt(settingsMap["lounge_max_days_in_advance"] ?? "30", 10);
    const minBookingDuration = parseInt(settingsMap["lounge_min_booking_minutes"] ?? "30", 10);
    const endDate = addDays(localNow, maxDaysAdvance);

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
        .lte("end_timestamp", endDate.toISOString());
    if (bookingsError || !bookingsData) {
        console.error("Error fetching bookings:", bookingsError);
        return [];
    }
    const bookings = bookingsData.map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp)
    }));

    // For each day in the range, check for an available slot.
    for (let i = 0; i < maxDaysAdvance; i++) {
        const currentDate = addDays(startDate, i); // currentDate is a UTC Date representing the start of day in Halifax
        const weekday = currentDate.getDay(); // 0=Sun, 6=Sat

        // Skip the day if no availability is defined.
        if (!availability[weekday]) continue;

        // Determine the day's start and end times by parsing the availability strings.
        let dayStart = parseTimeStringToDate(currentDate, availability[weekday].open, timezone);
        const dayEnd = parseTimeStringToDate(currentDate, availability[weekday].close, timezone);

        // For today, if localNow is later than the opening time, adjust the start time.
        if (i === 0 && localNow > dayStart) {
            dayStart = roundUp15(localNow);
            if (localNow >= dayEnd) continue;
        }

        // Check if there is at least one available slot during the day.
        const isSlotAvailable = await checkRangeSlotAvailability(bookings, dayStart, dayEnd, minBookingDuration);
        if (isSlotAvailable) {
            availableDates.push(currentDate);
        }
    }
    return availableDates;
}

/**
 * Retrieves available dates for station bookings in the client's timezone time.
 * Station-specific availability is used if available, falling back to global station availability.
 *
 * @param {string} stationId - The station identifier.
 * @param {Record<string, string>} settingsMap - A map of booking settings.
 * @param {Date} startDate - The start of day in the client's timezone as a UTC Date.
 * @param {Date} localNow - The current time in the client's timezone.
 * @param {string} timezone - The client's timezone
 * @returns {Promise<Date[]>} A promise that resolves to an array of available station Date objects.
 */
async function getStationAvailableDates(
    stationId: string,
    settingsMap: Record<string, string>,
    startDate: Date,
    localNow: Date,
    timezone: string
): Promise<Date[]> {
    const supabase = await createClient();

    const availableDates: Date[] = [];
    const maxDaysAdvance = parseInt(settingsMap["station_max_days_in_advance"] ?? "30", 10);
    const minBookingDuration = parseInt(settingsMap["station_min_booking_minutes"] ?? "30", 10);
    const endDate = addDays(localNow, maxDaysAdvance);

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

    // Parse and merge station-specific availability over global availability.
    const availability = parseAvailability(stationAvailabilityData ?? [], globalAvailabilityData);
    console.log("Availability:", availability)

    // Fetch approved lounge bookings (affecting all stations).
    const { data: loungeBookingsData, error: loungeBookingsError } = await supabase
        .from("lounge_bookings")
        .select()
        .eq("status", "approved")
        .gte("start_timestamp", startDate.toISOString())
        .lte("end_timestamp", endDate.toISOString());

    // Fetch station bookings for the given station.
    const { data: stationBookingsData, error: stationBookingsError } = await supabase
        .from("station_bookings")
        .select()
        .eq("station_id", stationId)
        .neq("status", "cancelled")
        .gte("start_timestamp", startDate.toISOString())
        .lte("end_timestamp", endDate.toISOString());
    if (loungeBookingsError || stationBookingsError || !loungeBookingsData || !stationBookingsData) {
        console.error("Error fetching bookings:", loungeBookingsError, stationBookingsError);
        return [];
    }
    const combinedBookingsData = [...loungeBookingsData, ...stationBookingsData];
    const bookings = combinedBookingsData.map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp)
    }));
    console.log("Bookings:", bookings)

    // For each day in the range, check for an available slot.
    for (let i = 0; i < maxDaysAdvance; i++) {
        const currentDate = addDays(startDate, i);
        const weekday = currentDate.getDay();
        if (!availability[weekday]) continue;

        let dayStart = parseTimeStringToDate(currentDate, availability[weekday].open, timezone);
        const dayEnd = parseTimeStringToDate(currentDate, availability[weekday].close, timezone);

        console.log("------------")
        console.log("Current date:", currentDate)
        console.log("Current weekday:", weekday)

        if (i === 0 && localNow > dayStart) {
            dayStart = roundUp15(localNow);
            if (localNow > dayEnd) continue;
        }
        const isSlotAvailable = await checkRangeSlotAvailability(bookings, dayStart, dayEnd, minBookingDuration);
        if (isSlotAvailable) {
            availableDates.push(currentDate);
        }

        console.log("Day start:", dayStart)
        console.log("Day end:", dayEnd);
        console.log("Available:", isSlotAvailable);
    }
    return availableDates;
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