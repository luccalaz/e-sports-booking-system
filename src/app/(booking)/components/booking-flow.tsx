"use client"

import { useEffect, useState } from "react";
import { User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookingData } from "@/lib/types";
import LoungeBookingFlow from "./lounge/lounge-booking-flow";
import StationBookingFlow from "./station/station-booking-flow";
import { createClient } from "@/utils/supabase/client";

export const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function BookingFlow({ setImage }: { setImage: React.Dispatch<React.SetStateAction<string>> }) {

    const [currentStep, setCurrentStep] = useState<number>(1); // keep track of current step/page
    const [bookingData, setBookingData] = useState<BookingData>({
        userId: '',
        stationId: '',
        stationName: '',
        type: 'station',
        start_timestamp: undefined,
        end_timestamp: undefined,
        duration: 0,
        name: '',
        description: '',
        status: ''
    }); // keep track of the booking data being filled out in the flow

    // functions for easy navigation withing the flow page components
    const nextStep = (steps: number = 1) => setCurrentStep((prev) => prev + steps);
    const prevStep = (steps: number = 1) => setCurrentStep((prev) => Math.max(1, prev - steps));

    useEffect(() => {
        const supabase = createClient();
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setBookingData(prev => ({ ...prev, userId: data.user?.id || "" }));
        };
        fetchUser();
    }, [])

    return (
        <>
            {/* Show initial booking flow page for type selection */}
            {currentStep === 1 && (
                <div className="flex flex-col gap-6 justify-between lg:h-[472px]">
                    <div className="flex flex-col gap-6 justify-between max-h-[468px] lg:h-[468px]">
                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-bold text-title">What are you booking for?</h2>
                            <div className="text-xs md:text-sm text-zinc-500 pt-2">Select the option that better matches your case</div>
                        </div>
                        <div className="flex-grow">
                            <RadioGroup
                                className="space-y-1"
                                value={bookingData.type || "station"}
                                onValueChange={(value: string) => setBookingData({ ...bookingData, type: value })}
                            >
                                <div>
                                    <RadioGroupItem value="station" id="station" className="peer sr-only" />
                                    <Label htmlFor="station" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <User className="h-6 w-6" />
                                        <span className="flex-1 text-center">For myself</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="lounge" id="lounge" className="peer sr-only" />
                                    <Label htmlFor="lounge" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Users className="h-6 w-6" />
                                        <span className="flex-1 text-center">For a group or event</span>
                                    </Label>
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                    {"If you're planning an event or have a large group coming, you can request to book off the entire lounge for a period of time."}
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => nextStep()}>
                                Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Station Booking Flow */}
            {bookingData.type === "station" && currentStep > 1 && (
                <StationBookingFlow
                    bookingData={bookingData}
                    setBookingData={setBookingData}
                    setImage={setImage}
                    currentStep={currentStep}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}

            {/* Show Lounge Booking Flow */}
            {bookingData.type === "lounge" && currentStep > 1 && (
                <LoungeBookingFlow
                    bookingData={bookingData}
                    setBookingData={setBookingData}
                    currentStep={currentStep}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}
        </>
    );
}
