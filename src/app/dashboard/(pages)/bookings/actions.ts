import { createClient } from "@/utils/supabase/client";
import { StationBooking } from "./components/data-table";

export async function getBookingsForDate(date: Date) {
    const supabase = createClient();

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1,
    );

    const { data, error } = await supabase
        .from("station_bookings")
        .select("*, booked_by(first_name, last_name), station:station_id(name)")
        .gte("start_timestamp", start.toISOString())
        .lt("start_timestamp", end.toISOString());

    if (error) throw error;

    const bookings: StationBooking[] = (data ?? []).map((entry) => ({
        id: String(entry.id),
        date: new Date(entry.start_timestamp),
        duration: entry.duration,
        station: entry.station?.name ?? `Station ${entry.station_id}`,
        booked_by: {
            first_name: entry.booked_by?.first_name ?? "Unknown",
            last_name: entry.booked_by?.last_name ?? "User",
        },
        status: entry.status,
    }));

    return bookings;
}

/**
 * Cancels an upcoming booking.
 * Only allowed if the booking is still "confirmed" and has not ended yet.
 */
export async function cancelBooking(booking: StationBooking): Promise<void> {
    const now = new Date();
    const start = booking.date; // booking.date represents the start time
    // Calculate the end time based on the duration (assumed to be in minutes)
    const end = new Date(start.getTime() + booking.duration * 60000);

    // Only confirmed bookings can be cancelled
    if (booking.status !== "confirmed") {
        throw new Error("Only confirmed bookings can be cancelled.");
    }

    // Allow cancellation if the booking is upcoming or in progress.
    // But if the booking has ended, cancellation is not allowed.
    if (now >= end) {
        throw new Error("Cannot cancel a booking that has already ended.");
    }

    const supabase = createClient();
    const { error } = await supabase
        .from("station_bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

    if (error) {
        throw error;
    }
}

/**
 * Marks a booking as no-show.
 * This action is allowed if the booking is no longer upcoming. That is, either it is in progress or already ended.
 */
export async function markNoShow(booking: StationBooking): Promise<void> {
    const now = new Date();
    const start = booking.date;

    // Only confirmed bookings that have started can be marked as no-show.
    if (booking.status !== "confirmed") {
        throw new Error("Only confirmed bookings can be marked as no-show.");
    }
    if (now < start) {
        throw new Error("Cannot mark a booking as no-show before it starts.");
    }

    const supabase = createClient();
    const { error } = await supabase
        .from("station_bookings")
        .update({ status: "noshow" })
        .eq("id", booking.id);

    if (error) {
        throw error;
    }
}
