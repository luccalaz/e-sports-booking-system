import { BookingFlowProps } from '@/utils/types'
import React from 'react'
import StepStationSelection from './step-station-selection'

export default function StationBookingFlow({ bookingData, setBookingData, currentStep, nextStep, prevStep }: BookingFlowProps) {
    return (
        <>
            {currentStep === 2 && (
                <StepStationSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {/* {currentStep === 3 && (
                <StepDateSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 4 && (
                <StepConfirmBooking bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )} */}
        </>
    )
}
