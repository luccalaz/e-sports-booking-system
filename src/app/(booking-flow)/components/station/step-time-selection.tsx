import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import ErrorOverlay from "@/components/ui/error-overlay";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { startOfDay } from "date-fns";

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    nextStep: () => void,
    prevStep: () => void
}

export default function StepStationTimeSelection({ bookingData, setBookingData, setImage, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [availableTimes, setAvailableTimes] = useState<Date[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function fetchDates() {
            // setAvailableTimes(await getAvailableTimes(startOfDay(bookingData.start_timestamp!), bookingData.stationId));
            setLoading(false);
        };
        fetchDates();
    }, []);

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    What time will you be there?
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    Select an available time to book the station for
                </div>
            </div>
            <div className="h-full overflow-y-auto relative">
                {loading ? <LoadingOverlay /> : error ? <ErrorOverlay /> : (
                    <RadioGroup
                        defaultValue={bookingData.start_timestamp?.toISOString()}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1"
                        onValueChange={(timestamp: string) => {
                            setBookingData({ ...bookingData, start_timestamp: new Date(timestamp) });
                        }}
                    >
                        {availableTimes?.map((time) => (
                            <div key={time.toISOString()}>
                                <RadioGroupItem
                                    value={time.toISOString()}
                                    id={`time-${time.toISOString()}`}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={`time-${time.toISOString()}`}
                                    className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <span className="flex-1 text-center">
                                        {time.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
            </div>
            <div>
                <Button className="w-full" onClick={nextStep}>
                    Continue
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    onClick={() => {
                        setBookingData({ ...bookingData, start_timestamp: undefined });
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
