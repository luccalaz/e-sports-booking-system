import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StationBookingFlowStepProps } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { Calendar } from "@/components/ui/calendar";
import ErrorOverlay from "@/components/ui/error-overlay";
import { getUnavailableDates } from "../../actions";

export default function StepStationDateSelection({ bookingData, setBookingData, setImage, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [unavailableDates, setUnavailableDates] = useState<Date[] | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function fetchDates() {
            const response = await getUnavailableDates(bookingData.stationId);
            if (!response) {
                return setError(true);
            }
            setUnavailableDates(response);
            setLoading(false);
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
                        selected={bookingData.start_timestamp}
                        disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const lastAllowed = new Date(today);
                            lastAllowed.setDate(lastAllowed.getDate() + 29);

                            // Disable if date is outside [today..today+29] or in unavailableDates
                            return (
                                date < today ||
                                date > lastAllowed ||
                                unavailableDates!.some((u) =>
                                    u.getFullYear() === date.getFullYear() &&
                                    u.getMonth() === date.getMonth() &&
                                    u.getDate() === date.getDate()
                                )
                            );
                        }}
                        fromMonth={new Date()}
                        toMonth={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                        onSelect={(selectedDate) => {
                            setBookingData({ ...bookingData, start_timestamp: selectedDate });
                            console.log(selectedDate);
                        }}
                        className="border"
                    />

                )}
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.start_timestamp} onClick={nextStep}>
                    Continue
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    onClick={() => {
                        setBookingData({ ...bookingData, stationId: undefined, start_timestamp: undefined });
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
