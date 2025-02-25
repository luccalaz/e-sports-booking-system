import React from 'react'
import StepStationSelection from './step-station-selection'
import StepStationDateSelection from './step-date-selection'
import { BookingData } from '@/lib/types'

export interface StationBookingFlowProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    currentStep: number,
    nextStep: () => void,
    prevStep: () => void
}

export default function StationBookingFlow({ bookingData, setBookingData, setImage, currentStep, nextStep, prevStep }: StationBookingFlowProps) {
    return (
        <>
            {currentStep === 2 && (
                <StepStationSelection bookingData={bookingData} setBookingData={setBookingData} setImage={setImage} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 3 && (
                <StepStationDateSelection bookingData={bookingData} setBookingData={setBookingData} setImage={setImage} nextStep={nextStep} prevStep={prevStep} />
            )}
        </>
    )
}
