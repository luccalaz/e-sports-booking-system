import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { Calendar } from "@/components/ui/calendar";
import ErrorOverlay from "@/components/ui/error-overlay";
import { getAvailableDates } from "../../booking";

export interface LoungeBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepLoungeDateSelection({ bookingData, setBookingData, nextStep, prevStep }: LoungeBookingFlowStepProps) {
    const [availableDates, setAvailableDates] = useState<Date[] | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        async function fetchDates() {
            const response = await getAvailableDates();
            if (!response) {
                return setError(true);
            }
            setAvailableDates(response);
            setLoading(false);
        };
        fetchDates();
    }, []);

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    When is your event?
                </h2>
                <div className="text-sm text-zinc-500 pt-2">
                    Select the date you want to book the lounge for
                </div>
            </div>
            <div className="flex-grow overflow-y-hidden flex justify-center relative">
                {loading ? <LoadingOverlay /> : error ? <ErrorOverlay /> : (
                    <Calendar
                        mode="single"
                        selected={bookingData.start_timestamp}
                        disabled={(date) => {
                            // Disable if date is not in availableDates
                            return !availableDates?.some((availableDate) =>
                                availableDate.getFullYear() === date.getFullYear() &&
                                availableDate.getMonth() === date.getMonth() &&
                                availableDate.getDate() === date.getDate()
                            );
                        }}
                        fromMonth={new Date()}
                        toMonth={availableDates ? new Date(Math.max(...availableDates.map(date => date.getTime()))) : new Date()}
                        onSelect={(selectedDate) => setBookingData({ ...bookingData, start_timestamp: selectedDate })}
                        className="border"
                    />
                )}
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.start_timestamp} onClick={() => nextStep()}>
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
