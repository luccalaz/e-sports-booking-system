import { Button } from "@/components/ui/button";
import { BookingData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface LoungeBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: (steps?: number) => void,
    prevStep: (steps?: number) => void
}

export default function StepLoungeDescription({ bookingData, setBookingData, nextStep, prevStep }: LoungeBookingFlowStepProps) {

    return (
        <div className="flex flex-col gap-6 justify-between h-[472px] lg:h-[472px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    What’s your event about?
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    Give us some context about what your event is
                </div>
            </div>
            <div className="flex flex-col gap-5 h-full relative">
                <div className="space-y-1">
                    <Label htmlFor="name">Event name</Label>
                    <Input type="text" placeholder="e.g Game Night" id="name" maxLength={100} onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="name">Event description</Label>
                    <Textarea id="description" maxLength={300} placeholder="Tell us a bit about your event" rows={6} onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })} />
                    <div className="text-xs md:text-sm text-zinc-500 mt-1">
                        Make sure to include any special requests.
                    </div>
                </div>
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.name || !bookingData.description} onClick={() => nextStep()}>
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
