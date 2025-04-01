import { BookingData } from '@/lib/types'
import React from 'react'
import StepLoungeDateSelection from './step-date-selection'
import StepLoungeTimeSelection from './step-time-selection'
import StepLoungeDurationSelection from './step-duration-selection'
import StepLoungeDescription from './step-description'
import StepLoungeConfirmation from './step-confirmation'
import StepLoungeSuccess from './step-success'

export interface LoungeBookingFlowProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    currentStep: number,
    nextStep: () => void,
    prevStep: () => void
}

export default function LoungeBookingFlow({ bookingData, setBookingData, currentStep, nextStep, prevStep }: LoungeBookingFlowProps) {
    return (
        <>
            {currentStep === 2 && (
                <StepLoungeDateSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 3 && (
                <StepLoungeTimeSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 4 && (
                <StepLoungeDurationSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 5 && (
                <StepLoungeDescription bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 6 && (
                <StepLoungeConfirmation bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 7 && (
                <StepLoungeSuccess bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
        </>
    )
}
