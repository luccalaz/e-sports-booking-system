import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Calendar, CircleCheckBig, Clock, Tag, TextCursorInput, Timer, Users } from "lucide-react";

export interface LoungeBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepLoungeSuccess({ bookingData, setBookingData, nextStep, prevStep }: LoungeBookingFlowStepProps) {
    return (
        <div className="flex flex-col gap-6 justify-between lg:h-[472px]">
            <div className="flex flex-col items-center justify-center text-title">
                <CircleCheckBig className="w-10 h-10" />
                <h2 className="text-xl md:text-2xl font-bold mt-1">
                    You're all set!
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    You will receive an email if your request is approved
                </div>
            </div>
            <div className="flex flex-col gap-6 h-full overflow-y-auto relative">
                <div className="border-2 p-4 space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Type</div>
                        <div>Group / Event</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TextCursorInput className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Name</div>
                        <div>{bookingData.name}</div>
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
                    <div className="flex items-center gap-2">
                        <Tag className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Status</div>
                        <Badge variant={"outline"} className="bg-warning">Pending approval</Badge>
                    </div>
                </div>
                <div className="text-xs md:text-sm text-center text-zinc-500">
                    A confirmation email has been sent to you
                </div>
            </div>
            <Button
                className="w-full"
                asChild
            >
                <a href="/bookings">View my bookings</a>
            </Button>
        </div>
    );
}
