import { DEFAULT_MAX_DAYS_ADVANCE, TIME_INTERVAL_MINUTES, TIME_INTERVAL_MS } from "@/lib/consts";
import { Booking, UserBooking } from "@/lib/types";
import { AvailabilityOutput, getDateRange, parseAvailability, parseSettings, parseTimeStringToDate, roundUpToNextQuarterHour, safeParseInt } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { addDays } from "date-fns";

/**
 * Validates if a booking can be made based on provided data, availability, settings, and existing bookings.
 */
export async function validateBooking(
    start_timestamp: Date,
    end_timestamp: Date,
    stationId?: string
): Promise<boolean> {
    try {
        // Ensure that the start is before the end.
        if (start_timestamp >= end_timestamp) return false;

        const durationMinutes = (end_timestamp.getTime() - start_timestamp.getTime()) / (60 * 1000);

        // Initialize Supabase client.
        const supabase = createClient();

        // Determine settings keys and fallback defaults based on type.
        const settingsKeys =
            stationId
                ? ["station_min_booking_minutes", "station_max_booking_minutes"]
                : ["lounge_min_booking_minutes", "lounge_max_booking_minutes"];

        // Fetch booking duration settings.
        const { data: settingsRows, error: settingsError } = await supabase
            .from("settings")
            .select()
            .in("key", settingsKeys);
        if (settingsError || !settingsRows) {
            throw new Error("Error fetching settings");
        }
        const settingsMap = parseSettings(settingsRows);
        const minBookingDuration = safeParseInt(
            settingsMap[settingsKeys[0]],
            stationId ? 30 : 15
        );
        const maxBookingDuration = safeParseInt(settingsMap[settingsKeys[1]], 120);

        // Check if booking duration falls within allowed range.
        if (durationMinutes < minBookingDuration || durationMinutes > maxBookingDuration) {
            return false;
        }

        // Get weekday from the booking's start date.
        const weekday = start_timestamp.getDay();
        let availabilityData: AvailabilityOutput = {};

        // Fetch availability schedules based on booking type.
        if (stationId) {
            // For station bookings, fetch both station-specific and global station availability concurrently.
            const stationAvailabilityPromise = supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "station")
                .eq("station_id", stationId);
            const globalAvailabilityPromise = supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "global_station");
            const [stationAvailabilityResponse, globalAvailabilityResponse] = await Promise.all([
                stationAvailabilityPromise,
                globalAvailabilityPromise,
            ]);
            if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
                throw new Error("Error fetching global station availability");
            }
            availabilityData = parseAvailability(
                stationAvailabilityResponse.data || [],
                globalAvailabilityResponse.data
            );
        } else {
            // For lounge bookings, fetch global lounge availability.
            const { data: loungeAvailabilityData, error: loungeAvailabilityError } = await supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "global_lounge");
            if (loungeAvailabilityError || !loungeAvailabilityData) {
                throw new Error("Error fetching lounge availability");
            }
            availabilityData = parseAvailability(loungeAvailabilityData);
        }

        // Get the schedule for the booking day.
        const schedule = availabilityData[String(weekday)];
        if (!schedule) return false;

        // Calculate the day's available window.
        const dayStart = parseTimeStringToDate(start_timestamp, schedule.open, schedule.timezone);
        const dayEnd = parseTimeStringToDate(start_timestamp, schedule.close, schedule.timezone);

        // Verify that the booking falls entirely within the day's available time.
        if (start_timestamp < dayStart || end_timestamp > dayEnd) return false;

        // Fetch existing bookings for the day.
        let bookings: Booking[] = [];
        if (stationId) {
            // For station bookings, fetch both lounge and station bookings concurrently.
            const loungeBookingsPromise = supabase
                .from("lounge_bookings")
                .select()
                .eq("status", "approved")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            const stationBookingsPromise = supabase
                .from("station_bookings")
                .select()
                .eq("station_id", stationId)
                .neq("status", "cancelled")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
                loungeBookingsPromise,
                stationBookingsPromise,
            ]);
            if (
                loungeBookingsResponse.error ||
                stationBookingsResponse.error ||
                !loungeBookingsResponse.data ||
                !stationBookingsResponse.data
            ) {
                throw new Error("Error fetching bookings");
            }
            bookings = [...loungeBookingsResponse.data, ...stationBookingsResponse.data].map((b: Booking) => ({
                ...b,
                start_timestamp: new Date(b.start_timestamp),
                end_timestamp: new Date(b.end_timestamp),
            }));
        } else {
            // For lounge bookings, fetch lounge bookings for the day.
            const { data: bookingsData, error: bookingsError } = await supabase
                .from("lounge_bookings")
                .select()
                .eq("status", "approved")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            if (bookingsError || !bookingsData) {
                throw new Error("Error fetching lounge bookings");
            }
            bookings = bookingsData.map((b: Booking) => ({
                ...b,
                start_timestamp: new Date(b.start_timestamp),
                end_timestamp: new Date(b.end_timestamp),
            }));
        }

        // Check for overlapping bookings.
        const overlaps = bookings.some((bk: Booking) => {
            // Overlap occurs if the new booking's start is before an existing booking's end
            // and the new booking's end is after an existing booking's start.
            return start_timestamp < bk.end_timestamp && end_timestamp > bk.start_timestamp;
        });
        if (overlaps) return false;

        // All validations passed.
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * Attempts to book a station for a user within a given time range.
 */
export async function bookStation(
    userId: string,
    stationId: string,
    start_timestamp: Date,
    end_timestamp: Date,
): Promise<{ success: boolean, error?: unknown }> {
    try {
        const success = await validateBooking(start_timestamp, end_timestamp, stationId);
        if (!success) {
            return { success: false, error: "Booking validation failed" };
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("station_bookings")
            .insert([{ booked_by: userId, station_id: stationId, start_timestamp, end_timestamp }]);
        if (error) {
            return { success: false, error: error?.message };
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMessage };
    }
}

/**
 * Attempts to book the lounge for a user within a given time range.
 */
export async function bookLounge(
    userId: string,
    name: string,
    description: string,
    start_timestamp: Date,
    end_timestamp: Date,
): Promise<{ success: boolean, error?: string }> {
    try {
        const success = validateBooking(start_timestamp, end_timestamp);
        if (!success) {
            return { success: false, error: "Booking validation failed" };
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("lounge_bookings")
            .insert([{ booked_by: userId, name, description, start_timestamp, end_timestamp }]);
        if (error) {
            return { success: false, error: error?.message };
        }

        return { success: true };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMessage };
    }
}

export async function cancelBooking(booking_id: string) {

}

/**
 * Determines the display status for a booking based on its type, db status, and current time.
 */
function getDisplayStatus(
    booking: Booking
): { status: string, badge: string } {
    const now = new Date();

    if (booking.station) {
        if (booking.status === "cancelled") return { status: "Cancelled", badge: "destructive" };
        if (booking.status === "noshow") return { status: "No-show", badge: "warning" };
        if (booking.status === "confirmed") {
            if (now < booking.start_timestamp) return { status: "Upcoming", badge: "default" };
            if (now >= booking.start_timestamp && now < booking.end_timestamp) return { status: "In-progress", badge: "outline" };
            if (now >= booking.end_timestamp) return { status: "Ended", badge: "outline" };
        }
        return { status: booking.status, badge: "default" };
    } else {
        if (booking.status === "cancelled") return { status: "Cancelled", badge: "destructive" };
        if (booking.status === "denied") return { status: "Denied", badge: "destructive" };
        if (booking.status === "pending") return { status: "Pending approval", badge: "warning" };
        if (booking.status === "approved") {
            if (now < booking.start_timestamp) return { status: "Confirmed", badge: "default" };
            if (now >= booking.start_timestamp && now < booking.end_timestamp) return { status: "In-progress", badge: "outline" };
            if (now >= booking.end_timestamp) return { status: "Ended", badge: "outline" };
        }
        return { status: booking.status, badge: "default" };
    }
}

/**
 * Fetches the user's bookings, splits them into upcoming and past bookings, and adds display status
 */
export async function getMyBookings(userId: string): Promise<UserBooking[]> {
    try {
        const supabase = createClient();
        const now = new Date();

        // Fetch station bookings (including a joined station detail) for the user.
        const { data: stationBookings, error: stationBookingsError } = await supabase
            .from("station_bookings")
            .select("*, station:station_id(name, img_url)")
            .eq("booked_by", userId);

        // Fetch lounge bookings for the user.
        const { data: loungeBookings, error: loungeBookingsError } = await supabase
            .from("lounge_bookings")
            .select()
            .eq("booked_by", userId);

        if (stationBookingsError || loungeBookingsError) {
            throw new Error("Error fetching bookings");
        }

        // Process station bookings.
        const processedBookings: UserBooking[] = [...stationBookings, ...loungeBookings].map((booking: Booking) => {
            const start_timestamp = new Date(booking.start_timestamp);
            const end_timestamp = new Date(booking.end_timestamp);
            const display = getDisplayStatus({ ...booking, start_timestamp, end_timestamp });
            const duration = (end_timestamp.getTime() - start_timestamp.getTime()) / (60 * 1000);
            return {
                ...booking,
                display: { ...display, date_status: (end_timestamp >= now ? "upcoming" : "past") },
                start_timestamp,
                end_timestamp,
                duration,
            };
        });

        return processedBookings;
    } catch (err) {
        console.error(err);
        return [];
    }
}


// /**
//  * Returns permission for booking
//  */
// export async function getBookingPermissions(userId: string, bookingId: string): {
// }

/**
 * Retrieves available booking dates for either lounge or station bookings.
 */
export async function getAvailableDates(stationId?: string): Promise<Date[]> {
    try {
        const supabase = createClient();

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
            throw new Error("Error fetching settings");
        }
        const settingsMap = parseSettings(settingsRows);

        // Delegate to the appropriate branch.
        return stationId
            ? await getStationAvailableDates(stationId, settingsMap)
            : await getLoungeAvailableDates(settingsMap);
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Retrieves available dates for lounge bookings.
 */
async function getLoungeAvailableDates(settingsMap: Record<string, string>): Promise<Date[]> {
    try {
        const supabase = createClient();
        const maxDaysAdvance = safeParseInt(settingsMap["lounge_max_days_in_advance"], DEFAULT_MAX_DAYS_ADVANCE);
        const minBookingDuration = safeParseInt(settingsMap["lounge_min_booking_minutes"], 30);
        const now = new Date();
        const { startDate, endDate } = getDateRange(maxDaysAdvance);

        // Fetch global lounge availability schedules.
        const { data: rawAvailability, error: availabilityError } = await supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "global_lounge");
        if (availabilityError || !rawAvailability) {
            throw new Error("Error fetching availability schedules");
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
            throw new Error("Error fetching bookings");
        }
        const bookings = bookingsData.map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));

        return await computeAvailableDates(startDate, maxDaysAdvance, now, availability, bookings, minBookingDuration);
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Retrieves available dates for station bookings.
 */
async function getStationAvailableDates(
    stationId: string,
    settingsMap: Record<string, string>
): Promise<Date[]> {
    try {
        const supabase = createClient();
        const maxDaysAdvance = safeParseInt(settingsMap["station_max_days_in_advance"], DEFAULT_MAX_DAYS_ADVANCE);
        const minBookingDuration = safeParseInt(settingsMap["station_min_booking_minutes"], 30);
        const now = new Date();
        const { startDate, endDate } = getDateRange(maxDaysAdvance);

        // Fetch availability schedules concurrently.
        const globalAvailabilityPromise = supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "global_station");
        const stationAvailabilityPromise = supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "station")
            .eq("station_id", stationId);
        const [globalAvailabilityResponse, stationAvailabilityResponse] = await Promise.all([
            globalAvailabilityPromise,
            stationAvailabilityPromise,
        ]);
        if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
            throw new Error("Error fetching global availability schedules");
        }
        const globalAvailabilityData = globalAvailabilityResponse.data;
        const stationAvailabilityData = stationAvailabilityResponse.data || [];
        const availability = parseAvailability(stationAvailabilityData, globalAvailabilityData);

        // Fetch bookings concurrently.
        const loungeBookingsPromise = supabase
            .from("lounge_bookings")
            .select()
            .eq("status", "approved")
            .gte("start_timestamp", startDate.toISOString())
            .lte("start_timestamp", endDate.toISOString());
        const stationBookingsPromise = supabase
            .from("station_bookings")
            .select()
            .eq("station_id", stationId)
            .neq("status", "cancelled")
            .gte("start_timestamp", startDate.toISOString())
            .lte("start_timestamp", endDate.toISOString());
        const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
            loungeBookingsPromise,
            stationBookingsPromise,
        ]);
        if (
            loungeBookingsResponse.error ||
            stationBookingsResponse.error ||
            !loungeBookingsResponse.data ||
            !stationBookingsResponse.data
        ) {
            throw new Error("Error fetching bookings");
        }
        const bookingsData = [...loungeBookingsResponse.data, ...stationBookingsResponse.data];
        const bookings = bookingsData.map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));

        return await computeAvailableDates(startDate, maxDaysAdvance, now, availability, bookings, minBookingDuration);
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Retrieves all available starting times for a given date.
 * If a stationId is provided, station start times are returned; otherwise, lounge start times.
 */
export async function getAvailableStartTimes(
    selectedDate: Date,
    stationId?: string
): Promise<Date[]> {
    return stationId
        ? await getStationAvailableStartTimes(selectedDate, stationId)
        : await getLoungeAvailableStartTimes(selectedDate);
}

/**
 * Retrieves available start times for lounge bookings.
 */
async function getLoungeAvailableStartTimes(selectedDate: Date): Promise<Date[]> {
    try {
        const supabase = createClient();
        const weekday = selectedDate.getDay();
        const settingsKey = "lounge_min_booking_minutes";

        // Fetch booking settings.
        const { data: settingsRows, error: settingsError } = await supabase
            .from("settings")
            .select()
            .in("key", [settingsKey]);
        if (settingsError || !settingsRows) {
            throw new Error("Error fetching settings");
        }
        const settingsMap = parseSettings(settingsRows);
        const minBookingDuration = safeParseInt(settingsMap[settingsKey], 15);

        // Fetch lounge availability schedules.
        const { data: loungeAvailabilityData, error: loungeAvailabilityError } = await supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "global_lounge");
        if (loungeAvailabilityError || !loungeAvailabilityData) {
            throw new Error("Error fetching lounge availability");
        }
        const availabilityData = parseAvailability(loungeAvailabilityData);
        if (!availabilityData[String(weekday)]) return [];
        const schedule = availabilityData[String(weekday)]!;
        const dayStart = parseTimeStringToDate(selectedDate, schedule.open, schedule.timezone);
        const dayEnd = parseTimeStringToDate(selectedDate, schedule.close, schedule.timezone);

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        let candidateStartTime = dayStart.getTime();
        if (isToday) {
            const roundedNow = roundUpToNextQuarterHour(now);
            candidateStartTime = Math.max(dayStart.getTime(), roundedNow.getTime());
        }

        // Fetch lounge bookings for the day.
        const { data: bookingsData, error: bookingsError } = await supabase
            .from("lounge_bookings")
            .select()
            .eq("status", "approved")
            .gte("start_timestamp", dayStart.toISOString())
            .lte("start_timestamp", dayEnd.toISOString());
        if (bookingsError || !bookingsData) {
            throw new Error("Error fetching lounge bookings");
        }
        const bookings = bookingsData.map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));

        // Iterate over candidate start times in 15-minute increments.
        const availableStartTimes: Date[] = [];
        const latestCandidateTime = dayEnd.getTime() - minBookingDuration * 60 * 1000;
        for (let candidateTime = candidateStartTime; candidateTime <= latestCandidateTime; candidateTime += TIME_INTERVAL_MS) {
            const candidateStart = new Date(candidateTime);
            const candidateEnd = new Date(candidateTime + minBookingDuration * 60 * 1000);
            const slotAvailable = await checkRangeSlotAvailability(bookings, candidateStart, candidateEnd, minBookingDuration);
            if (slotAvailable) {
                availableStartTimes.push(candidateStart);
            }
        }
        return availableStartTimes;
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Retrieves available start times for station bookings.
 */
async function getStationAvailableStartTimes(
    selectedDate: Date,
    stationId: string
): Promise<Date[]> {
    try {
        const supabase = createClient();
        const weekday = selectedDate.getDay();
        const settingsKey = "station_min_booking_minutes";

        // Fetch booking settings.
        const { data: settingsRows, error: settingsError } = await supabase
            .from("settings")
            .select()
            .in("key", [settingsKey]);
        if (settingsError || !settingsRows) {
            throw new Error("Error fetching settings");
        }
        const settingsMap = parseSettings(settingsRows);
        const minBookingDuration = safeParseInt(settingsMap[settingsKey], 30);

        // Fetch station availability schedules concurrently.
        const stationAvailabilityPromise = supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "station")
            .eq("station_id", stationId);
        const globalAvailabilityPromise = supabase
            .from("availability_schedules")
            .select("weekday, open_time, close_time, timezone")
            .eq("type", "global_station");
        const [stationAvailabilityResponse, globalAvailabilityResponse] = await Promise.all([
            stationAvailabilityPromise,
            globalAvailabilityPromise,
        ]);
        if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
            throw new Error("Error fetching global station availability");
        }
        const availabilityData = parseAvailability(
            stationAvailabilityResponse.data || [],
            globalAvailabilityResponse.data
        );
        if (!availabilityData[String(weekday)]) return [];
        const schedule = availabilityData[String(weekday)]!;
        const dayStart = parseTimeStringToDate(selectedDate, schedule.open, schedule.timezone);
        const dayEnd = parseTimeStringToDate(selectedDate, schedule.close, schedule.timezone);

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        let candidateStartTime = dayStart.getTime();
        if (isToday) {
            const roundedNow = roundUpToNextQuarterHour(now);
            candidateStartTime = Math.max(dayStart.getTime(), roundedNow.getTime());
        }

        // Fetch station bookings concurrently.
        const loungeBookingsPromise = supabase
            .from("lounge_bookings")
            .select()
            .eq("status", "approved")
            .gte("start_timestamp", dayStart.toISOString())
            .lte("start_timestamp", dayEnd.toISOString());
        const stationBookingsPromise = supabase
            .from("station_bookings")
            .select()
            .eq("station_id", stationId)
            .neq("status", "cancelled")
            .gte("start_timestamp", dayStart.toISOString())
            .lte("start_timestamp", dayEnd.toISOString());
        const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
            loungeBookingsPromise,
            stationBookingsPromise,
        ]);
        if (
            loungeBookingsResponse.error ||
            stationBookingsResponse.error ||
            !loungeBookingsResponse.data ||
            !stationBookingsResponse.data
        ) {
            throw new Error("Error fetching bookings");
        }
        const bookings = [...loungeBookingsResponse.data, ...stationBookingsResponse.data].map((b: Booking) => ({
            ...b,
            start_timestamp: new Date(b.start_timestamp),
            end_timestamp: new Date(b.end_timestamp),
        }));

        // Iterate over candidate start times in 15-minute increments.
        const availableStartTimes: Date[] = [];
        const latestCandidateTime = dayEnd.getTime() - minBookingDuration * 60 * 1000;
        for (let candidateTime = candidateStartTime; candidateTime <= latestCandidateTime; candidateTime += TIME_INTERVAL_MS) {
            const candidateStart = new Date(candidateTime);
            const candidateEnd = new Date(candidateTime + minBookingDuration * 60 * 1000);
            const slotAvailable = await checkRangeSlotAvailability(bookings, candidateStart, candidateEnd, minBookingDuration);
            if (slotAvailable) {
                availableStartTimes.push(candidateStart);
            }
        }
        return availableStartTimes;
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Retrieves the available booking durations (in minutes) for a booking starting at a given time.
 * If a stationId is provided, station durations are returned; otherwise, lounge durations.
 */
export async function getAvailableBookingDurations(
    bookingStart: Date,
    stationId?: string
): Promise<string[]> {
    try {
        const supabase = createClient();
        const weekday = bookingStart.getDay();

        // Determine which settings keys to use based on booking type.
        const settingsKeys = stationId
            ? ["station_min_booking_minutes", "station_max_booking_minutes"]
            : ["lounge_min_booking_minutes", "lounge_max_booking_minutes"];

        // Fetch booking duration settings.
        const { data: settingsRows, error: settingsError } = await supabase
            .from("settings")
            .select()
            .in("key", settingsKeys);
        if (settingsError || !settingsRows) {
            throw new Error("Error fetching settings");
        }
        const settingsMap = parseSettings(settingsRows);
        // Use fallback defaults if not provided (e.g. 30 and 120 for station, 15 and 120 for lounge).
        const minBookingDuration = safeParseInt(
            settingsMap[settingsKeys[0]],
            stationId ? 30 : 15
        );
        const maxBookingDuration = safeParseInt(
            settingsMap[settingsKeys[1]],
            120
        );

        // Fetch the availability schedule.
        let availabilityData: AvailabilityOutput = {};
        if (stationId) {
            // For station bookings, merge station-specific and global station availability.
            const stationAvailabilityPromise = supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "station")
                .eq("station_id", stationId);
            const globalAvailabilityPromise = supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "global_station");
            const [stationAvailabilityResponse, globalAvailabilityResponse] = await Promise.all([
                stationAvailabilityPromise,
                globalAvailabilityPromise,
            ]);
            if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
                throw new Error("Error fetching global station availability");
            }
            availabilityData = parseAvailability(
                stationAvailabilityResponse.data || [],
                globalAvailabilityResponse.data
            );
        } else {
            // For lounge bookings, fetch the global lounge availability.
            const { data: loungeAvailabilityData, error: loungeAvailabilityError } = await supabase
                .from("availability_schedules")
                .select("weekday, open_time, close_time, timezone")
                .eq("type", "global_lounge");
            if (loungeAvailabilityError || !loungeAvailabilityData) {
                throw new Error("Error fetching lounge availability");
            }
            availabilityData = parseAvailability(loungeAvailabilityData);
        }

        // Get the schedule for the booking day.
        const schedule = availabilityData[String(weekday)];
        if (!schedule) return [];

        // Compute the day's start and end times based on the schedule.
        const dayStart = parseTimeStringToDate(bookingStart, schedule.open, schedule.timezone);
        const dayEnd = parseTimeStringToDate(bookingStart, schedule.close, schedule.timezone);

        // If the booking start time is outside the day's availability, return empty.
        if (bookingStart >= dayEnd || bookingStart < dayStart) return [];

        // Fetch bookings for the day.
        let bookings: Booking[] = [];
        if (stationId) {
            const loungeBookingsPromise = supabase
                .from("lounge_bookings")
                .select()
                .eq("status", "approved")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            const stationBookingsPromise = supabase
                .from("station_bookings")
                .select()
                .eq("station_id", stationId)
                .neq("status", "cancelled")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
                loungeBookingsPromise,
                stationBookingsPromise,
            ]);
            if (
                loungeBookingsResponse.error ||
                stationBookingsResponse.error ||
                !loungeBookingsResponse.data ||
                !stationBookingsResponse.data
            ) {
                throw new Error("Error fetching bookings");
            }
            bookings = [...loungeBookingsResponse.data, ...stationBookingsResponse.data].map((b: Booking) => ({
                ...b,
                start_timestamp: new Date(b.start_timestamp),
                end_timestamp: new Date(b.end_timestamp),
            }));
        } else {
            const { data: bookingsData, error: bookingsError } = await supabase
                .from("lounge_bookings")
                .select()
                .eq("status", "approved")
                .gte("start_timestamp", dayStart.toISOString())
                .lte("start_timestamp", dayEnd.toISOString());
            if (bookingsError || !bookingsData) {
                throw new Error("Error fetching lounge bookings");
            }
            bookings = bookingsData.map((b: Booking) => ({
                ...b,
                start_timestamp: new Date(b.start_timestamp),
                end_timestamp: new Date(b.end_timestamp),
            }));
        }

        // Iterate over candidate durations (in 15-minute increments) from min to max.
        const availableDurations: string[] = [];
        for (let duration = minBookingDuration; duration <= maxBookingDuration; duration += TIME_INTERVAL_MINUTES) {
            // Compute the candidate booking's end time.
            const candidateEnd = new Date(bookingStart.getTime() + duration * 60 * 1000);
            // If the candidate end exceeds the day's availability, stop checking further durations.
            if (candidateEnd > dayEnd) break;

            // Check for overlapping bookings.
            const overlaps = bookings.some((bk: Booking) => {
                // Two intervals overlap if bookingStart < bk.end and candidateEnd > bk.start.
                return bookingStart < bk.end_timestamp && candidateEnd > bk.start_timestamp;
            });

            if (!overlaps) {
                availableDurations.push(String(duration));
            }
        }

        return availableDurations;
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Iterates over the date range and checks each day for at least one available slot.
 */
export async function computeAvailableDates(
    startDate: Date,
    maxDaysAdvance: number,
    now: Date,
    availability: AvailabilityOutput,
    bookings: Booking[],
    minBookingDuration: number
): Promise<Date[]> {
    const availableDates: Date[] = [];
    for (let i = 0; i < maxDaysAdvance; i++) {
        const currentDate = addDays(startDate, i);
        const weekday = currentDate.getDay();
        const schedule = availability[String(weekday)];
        if (!schedule) continue;

        let dayStart = parseTimeStringToDate(currentDate, schedule.open, schedule.timezone);
        const dayEnd = parseTimeStringToDate(currentDate, schedule.close, schedule.timezone);

        // If today and current time is later than open time, start from the next available block.
        if (i === 0 && now > dayStart) {
            dayStart = roundUpToNextQuarterHour(now);
            if (dayStart >= dayEnd) continue;
        }
        const isSlotAvailable = await checkRangeSlotAvailability(bookings, dayStart, dayEnd, minBookingDuration);
        if (isSlotAvailable) {
            availableDates.push(currentDate);
        }
    }
    return availableDates;
}

/**
 * Checks if there is an available time slot within a given time range that can accommodate a booking.
 */
export async function checkRangeSlotAvailability(
    bookings: Booking[],
    dayStart: Date,
    dayEnd: Date,
    minBookingDuration: number
): Promise<boolean> {
    const requiredIntervals = minBookingDuration / TIME_INTERVAL_MINUTES;
    let slotStart = new Date(dayStart);
    let freeIntervals = 0;

    while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + TIME_INTERVAL_MS);
        if (slotEnd > dayEnd) break;
        const isBlocked = bookings.some(
            (bk: Booking) => bk.start_timestamp < slotEnd && bk.end_timestamp > slotStart
        );
        if (!isBlocked) {
            freeIntervals++;
            if (freeIntervals >= requiredIntervals) {
                return true;
            }
        } else {
            freeIntervals = 0;
        }
        slotStart = slotEnd;
    }
    return false;
}