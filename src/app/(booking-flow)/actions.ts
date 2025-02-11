"use server"

import { Booking } from "@/lib/types";
import { parseTimeStringToDate, startOfDay } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { addDays } from "date-fns";

// defining the number of days ahead users can book
const BOOKING_TIMEFRAME = 30;
const MIN_BOOKING_DURATION = 30;

export async function getUnavailableDates(stationId?: string) {
    const supabase = await createClient();
    const unavailableDates: Date[] = [];
    const now = new Date();

    // if stationId is passed in, get unavailable dates for that station
    const isStationBooking = !!stationId;

    // fetch all relevant bookings in the booking timeframe
    const futureDays = addDays(startOfDay(now), BOOKING_TIMEFRAME);
    const { data, error } = await supabase.from("bookings").select().lte("start_timestamp", futureDays.toISOString());
    if (error || !data) {
        return null;
    }

    const bookings = data.map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp),
    }));

    if (isStationBooking) {
        // get station availability
        const { data: station, error } = await supabase.from('stations').select('availability').eq('id', stationId).single();
        if (error || !station) {
            return null;
        }

        for (let i = 0; i < BOOKING_TIMEFRAME; i++) {
            const currentDay = startOfDay(addDays(now, i));
            const weekday = currentDay.getDay(); // 0=Sun, 6=Sat

            // check if station is unavailable that weekday
            if (!station.availability[weekday]) {
                unavailableDates.push(currentDay);
                continue;
            }

            let dayStart = parseTimeStringToDate(currentDay, station.availability[weekday].open);
            const dayEnd = parseTimeStringToDate(currentDay, station.availability[weekday].close)

            // if currentDay is today (i === 0), start from current time (now)
            if (i === 0 && now > dayStart) {
                dayStart = now;
                // check if it's already past closing time
                if (now >= dayEnd) {
                    unavailableDates.push(startOfDay(currentDay));
                    continue;
                }
            }

            // check if there's any free 15 minute interval between dayStart and dayEnd
            if (!checkAvailability(bookings, dayStart, dayEnd, 15)) {
                unavailableDates.push(startOfDay(currentDay));
                continue;
            }

        }
    }

    return unavailableDates;
}

export async function getAvailableTimes(date: Date, stationId?: string): Promise<Date[] | null> {
    const supabase = await createClient();
    const availableSlots: Date[] = [];
    const currentDay = startOfDay(date);
    const weekday = currentDay.getDay(); // 0=Sun, 6=Sat
    const now = new Date();

    // if stationId is passed in, get unavailable times for that station
    const isStationBooking = !!stationId;

    let dayStart: Date;
    let dayEnd: Date;

    if (isStationBooking) {
        // get station availability
        const { data: station, error } = await supabase.from('stations').select('availability').eq('id', stationId).single();
        if (error || !station) {
            return null;
        }

        dayStart = parseTimeStringToDate(currentDay, station.availability[weekday].open);
        dayEnd = parseTimeStringToDate(currentDay, station.availability[weekday].close);

        if (now > dayStart) dayStart = now;
    } else {
        // If no stationId is provided, return an empty array or handle as needed
        return availableSlots;
    }

    // fetch all bookings for that date and station
    const { data, error } = await supabase
        .from("bookings")
        .select()
        .eq('station_id', stationId)
        .gte("start_timestamp", dayStart.toISOString())
        .lte("end_timestamp", dayEnd.toISOString());

    if (error || !data) {
        return null;
    }

    const bookings = data.map((b: Booking) => ({
        ...b,
        start_timestamp: new Date(b.start_timestamp),
        end_timestamp: new Date(b.end_timestamp),
    }));

    // Each interval is 15 minutes
    const chunkMs = 15 * 60 * 1000;

    let slotStart = new Date(dayStart);

    // How many consecutive 15-min chunks do we need?
    const requiredChunks = MIN_BOOKING_DURATION / 15;

    while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + chunkMs);

        // If the slot would go past dayEnd, we can't fit a full 15-min chunk
        if (slotEnd > dayEnd) break;

        // Check if we have enough consecutive free slots starting at this time
        let consecutiveFree = 0;
        let checkSlot = new Date(slotStart);
        let isSlotAvailable = true;

        while (consecutiveFree < requiredChunks) {
            const checkEnd = new Date(checkSlot.getTime() + chunkMs);

            // If checking future slots would go past dayEnd, this slot isn't viable
            if (checkEnd > dayEnd) {
                isSlotAvailable = false;
                break;
            }

            // Check if this specific time slot overlaps with any booking
            const isBlocked = bookings.some(booking =>
                checkSlot < booking.end_timestamp &&
                checkEnd > booking.start_timestamp
            );

            if (isBlocked) {
                isSlotAvailable = false;
                break;
            }

            consecutiveFree++;
            checkSlot = checkEnd;
        }

        if (isSlotAvailable) {
            availableSlots.push(new Date(slotStart));
        }

        // Move to the next 15-minute chunk
        slotStart = slotEnd;
    }

    return availableSlots;
}

export async function checkAvailability(bookings: Booking[], dayStart: Date, dayEnd: Date, minDuration: number = MIN_BOOKING_DURATION) {
    // Each interval is 15 minutes
    const chunkMs = 15 * 60 * 1000;

    // How many consecutive 15-min chunks do we need?
    const requiredChunks = minDuration / 15;

    let slotStart = new Date(dayStart);
    let consecutiveFree = 0; // Count of consecutive free 15-min chunks

    while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + chunkMs);

        // If the slot would go past dayEnd, we can't fit a full 15-min chunk
        if (slotEnd > dayEnd) break;

        // Check if this 15-minute chunk overlaps any booking
        const isBlocked = bookings.some((bk) => {
            return (
                bk.start_timestamp < slotEnd &&
                bk.end_timestamp > slotStart
            );
        });

        if (!isBlocked) {
            consecutiveFree++;
            // If we reached the required consecutive chunks, we have enough free time
            if (consecutiveFree >= requiredChunks) {
                return true;
            }
        } else {
            // Reset consecutive free count if blocked
            consecutiveFree = 0;
        }

        // Move to the next 15-minute chunk
        slotStart = slotEnd;
    }

    // If we never found enough consecutive free 15-min chunks
    return false;
}