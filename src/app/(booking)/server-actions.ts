"use server"

import { Booking } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

/**
 * Fetches the user's bookings
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
    "use server"

    try {
        const supabase = await createClient();

        // Fetch station bookings (including a joined station detail) for the user.
        const { data: stationBookings, error: stationBookingsError } = await supabase
            .from("station_bookings")
            .select("*, station:station_id(id, name, img_url)")
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
        const processedBookings: Booking[] = [...stationBookings, ...loungeBookings].map((booking: Booking) => {
            const start_timestamp = new Date(booking.start_timestamp);
            const end_timestamp = new Date(booking.end_timestamp);
            return {
                ...booking,
                start_timestamp,
                end_timestamp,
            };
        });

        return processedBookings;
    } catch (err) {
        console.error(err);
        return [];
    }
}