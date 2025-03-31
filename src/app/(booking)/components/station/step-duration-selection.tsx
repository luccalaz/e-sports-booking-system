import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import ErrorOverlay from "@/components/ui/error-overlay";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/lib/utils";
import { getAvailableBookingDurations } from "../../actions";
import { addMinutes } from "date-fns";

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepStationDurationSelection({ bookingData, setBookingData, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [availableDurations, setAvailableDurations] = useState<string[] | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function fetchDurations() {
            const response = await getAvailableBookingDurations(bookingData.start_timestamp!, bookingData.station?.id);
            if (!response) {
                return setError(true);
            }
            setAvailableDurations(response);
            setLoading(false);
        };
        fetchDurations();
    }, [bookingData.start_timestamp, bookingData.station?.id])

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    How long will you be there for?
                </h2>
                <div className="text-sm text-zinc-500 pt-2">
                    Select a duration for {bookingData.start_timestamp?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {bookingData.start_timestamp?.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}
                </div>
            </div>
            <div className="h-full overflow-y-auto relative">
                {loading ? <LoadingOverlay /> : error ? <ErrorOverlay /> : (
                    <RadioGroup
                        className="grid grid-cols-1 gap-2 pb-1"
                        onValueChange={(duration: string) => {

                            setBookingData({ ...bookingData, end_timestamp: addMinutes(new Date(bookingData.start_timestamp!), parseInt(duration)), duration: parseInt(duration) });
                            setSelectedDuration(duration);
                        }}
                    >
                        {availableDurations?.map((duration) => (
                            <div key={duration}>
                                <RadioGroupItem
                                    value={duration}
                                    id={duration}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={duration}
                                    className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <span className="flex-1 text-center">
                                        {formatDuration(parseInt(duration))}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
            </div>
            <div>
                <Button className="w-full" disabled={!selectedDuration} onClick={() => nextStep()}>
                    Continue
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    onClick={() => {
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
