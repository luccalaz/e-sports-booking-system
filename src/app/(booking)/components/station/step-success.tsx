import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Calendar, CircleCheckBig, Clock, Gamepad2, Timer } from "lucide-react";
import Link from "next/link";

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepStationSuccess({ bookingData, setBookingData, nextStep, prevStep }: StationBookingFlowStepProps) {

    return (
        <div className="flex flex-col gap-6 justify-between lg:h-[472px]">
            <div className="flex flex-col items-center justify-center text-title mt-2">
                <CircleCheckBig className="w-10 h-10" />
                <h2 className="text-xl md:text-2xl font-bold mt-1">
                    You’re all set!
                </h2>
                <div className="text-sm text-zinc-500 pt-2">
                    Your booking has been successfully confirmed
                </div>
            </div>
            <div className="flex flex-col items-center gap-6 h-full overflow-y-auto relative">
                <div className="border-2 p-4 space-y-4 text-sm w-full">
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
                {/* <div className="text-xs md:text-sm text-zinc-500">
                    A confirmation email has been sent to you
                </div> */}
            </div>
            <div>
                <Button
                    className="w-full"
                    asChild
                >
                    <a href="/book">Book something else</a>
                </Button>
                <Button
                    className="w-full text-foreground pb-0 pt-3 h-fit"
                    variant={"link"}
                    asChild
                >
                    <Link href="/bookings">View my bookings</Link>
                </Button>
            </div>
        </div>
    );
}
