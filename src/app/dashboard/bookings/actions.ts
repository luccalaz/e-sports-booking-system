import { createClient } from "@/utils/supabase/client";
import { StationBooking } from "./components/data-table";
import { formatDuration } from "@/lib/utils";

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
        duration: formatDuration(entry.duration),
        station: entry.station?.name ?? `Station ${entry.station_id}`,
        booked_by: {
            first_name: entry.booked_by?.first_name ?? "Unknown",
            last_name: entry.booked_by?.last_name ?? "User",
        },
        status: entry.status,
    }));

    return bookings;
}
