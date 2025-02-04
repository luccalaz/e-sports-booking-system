"use client"

import { useState } from "react";
import StepTypeSelection from "./step-type-selection";
import StationBookingFlow from "./station/station-booking-flow";
import LoungeBookingFlow from "./lounge/lounge-booking-flow";
import { BookingData } from "@/utils/types";

export default function BookingFlow() {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [bookingData, setBookingData] = useState<BookingData>({
        userId: '',
        stationId: '',
        type: 'station',
        datetime: new Date(),
        duration: 0,
        name: '',
        description: '',
        status: ''
    });

    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => Math.max(1, prev - 1));

    return (
        <>
            {currentStep === 1 && (
                <div className="flex flex-col gap-6 justify-between lg:h-[468px]">
                    <StepTypeSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
                </div>
            )}

            {/* Load Station Booking Flow */}
            {bookingData.type === "station" && currentStep > 1 && (
                <StationBookingFlow
                    bookingData={bookingData}
                    setBookingData={setBookingData}
                    currentStep={currentStep}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}

            {/* Load Lounge Booking Flow */}
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
