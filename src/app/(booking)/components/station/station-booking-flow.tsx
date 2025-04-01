import React from 'react'
import { BookingData } from '@/lib/types'
import StepStationSelection from './step-station-selection'
import StepStationDateSelection from './step-date-selection'
import StepStationTimeSelection from './step-time-selection'
import StepStationDurationSelection from './step-duration-selection'
import StepStationConfirmation from './step-confirmation'
import StepStationSuccess from './step-success'

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
            {currentStep === 4 && (
                <StepStationTimeSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 5 && (
                <StepStationDurationSelection bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 6 && (
                <StepStationConfirmation bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
            {currentStep === 7 && (
                <StepStationSuccess bookingData={bookingData} setBookingData={setBookingData} nextStep={nextStep} prevStep={prevStep} />
            )}
        </>
    )
}
