import { Station } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export async function getStations() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("stations")
        .select("*")
        .order("id", { ascending: true });

    if (error) throw error;

    const stations: Station[] = (data ?? []).map((entry) => ({
        id: String(entry.id),
        name: String(entry.name),
        img_url: String(entry.img_url),
        status: String(entry.status),
    }));

    return stations;
}

export async function setStationStatus(
    station_id: string,
    status: "available" | "unavailable",
) {
    const supabase = createClient();
    const { error } = await supabase
        .from("stations")
        .update({ status: status })
        .eq("id", station_id);

    if (error) return false;

    return true;
}
