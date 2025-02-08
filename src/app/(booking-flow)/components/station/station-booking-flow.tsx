import { StationBookingFlowProps } from '@/lib/types'
import React from 'react'
import StepStationSelection from './step-station-selection'
import StepStationDateSelection from './step-date-selection'

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
