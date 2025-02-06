import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StationBookingFlowStepProps } from "@/utils/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { Calendar } from "@/components/ui/calendar";
import ErrorOverlay from "@/components/ui/error-overlay";

export default function StepStationDateSelection({ bookingData, setBookingData, setImage, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [unavailableDates, setUnavailableDates] = useState<Date[] | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function fetchDates() {
            setUnavailableDates([]);
        };
        fetchDates();
    }, []);

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    When do you want to play?
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    Select the date you want to book this station for
                </div>
            </div>
            <div className="flex-grow overflow-y-hidden flex justify-center relative">
                {/* Show Loading or station list inside the list area */}
                {loading ? <LoadingOverlay /> : error ? <ErrorOverlay /> : (
                    <Calendar
                        mode="single"
                        selected={bookingData.datetime}
                        disabled={(date) => {
                            const now = new Date();
                            now.setHours(0, 0, 0, 0); // Reset time to start of day
                            const thirtyDaysFromNow = new Date(now);
                            thirtyDaysFromNow.setDate(now.getDate() + 30);
                            return (
                                date < now ||
                                date > thirtyDaysFromNow ||
                                (unavailableDates?.some(
                                    (unavailable) => unavailable.getTime() === date.getTime()
                                ) ?? false)
                            );
                        }}
                        fromMonth={new Date()}
                        toMonth={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                        onSelect={(date) => setBookingData({ ...bookingData, datetime: date })}
                        className="border"
                    />
                )}
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.datetime} onClick={nextStep}>
                    Continue
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    onClick={() => {
                        setBookingData({ ...bookingData, stationId: undefined, datetime: undefined });
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
