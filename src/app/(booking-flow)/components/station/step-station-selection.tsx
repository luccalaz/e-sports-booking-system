import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/utils/supabase/client";
import { Station, BookingData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import ErrorOverlay from "@/components/ui/error-overlay";

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    nextStep: () => void,
    prevStep: () => void
}

export default function StepStationSelection({ bookingData, setBookingData, setImage, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [stations, setStations] = useState<Station[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>();

    useEffect(() => {
        const supabase = createClient();
        async function fetchStations() {
            const { data, error } = await supabase.from("stations").select().eq("status", "available").order("id", { ascending: true });
            setLoading(false);
            if (error || data.length < 1) {
                return setError(true);
            }

            setStations(data);
        }
        fetchStations();
    }, [bookingData.stationId, bookingData.start_timestamp]);

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    What do you want to play?
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    Select the game station you’d like to book
                </div>
            </div>
            <div className="h-full overflow-y-auto relative">
                {/* Show Loading or station list inside the list area */}
                {loading ? <LoadingOverlay /> : error ? <ErrorOverlay /> : (
                    <RadioGroup
                        defaultValue={bookingData.stationId}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1"
                        onValueChange={(stationId: string) => {
                            setBookingData({ ...bookingData, stationId: stationId });
                            setImage(stations.find(station => station.id === stationId)?.img_url || "");
                        }}
                    >
                        {stations.map((station) => (
                            <div key={station.id}>
                                <RadioGroupItem
                                    value={station.id}
                                    id={`station-${station.id}`}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={`station-${station.id}`}
                                    className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <span className="flex-1 text-center">
                                        {station.name}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.stationId} onClick={nextStep}>
                    Continue
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    onClick={() => {
                        setBookingData({ ...bookingData, stationId: undefined });
                        setImage("");
                        prevStep();
                    }}
                >
                    <ArrowLeft />
                    Go back
                </Button>
            </div>
        </div>
    );
}
