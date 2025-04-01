import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, Gamepad2, Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { bookStation } from "../../client-actions";

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepStationConfirmation({ bookingData, setBookingData, nextStep, prevStep }: StationBookingFlowStepProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const confirmBooking = async () => {
        setLoading(true);
        const response = await bookStation(bookingData.user_id!, bookingData.station!.id, bookingData.start_timestamp!, bookingData.end_timestamp!, bookingData.duration!);
        if (response.success) {
            toast.success("Booking confirmed! 🎉");
            nextStep();
        } else {
            setBookingData({ ...bookingData, start_timestamp: undefined, end_timestamp: undefined });
            prevStep(3);
            toast.error("The booking is no longer available. Please select a different date or time.");
        }
    }

    return (
        <div className="flex flex-col gap-6 justify-between lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    Does everything look right?
                </h2>
                <div className="text-sm text-zinc-500 pt-2">
                    Review your booking details to ensure it is correct
                </div>
            </div>
            <div className="h-full overflow-y-auto relative">
                <div className="border-2 p-4 space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Station</div>
                        <div>{bookingData.station?.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Date</div>
                        <div>{bookingData.start_timestamp?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Time</div>
                        <div>{bookingData.start_timestamp?.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Timer className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Duration</div>
                        <div>{formatDuration(bookingData.duration!)}</div>
                    </div>
                </div>
            </div>
            <div>
                <Button
                    className="w-full"
                    disabled={loading}
                    loading={loading ? "" : undefined}
                    onClick={confirmBooking}
                >
                    Confirm & book
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    disabled={loading}
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
