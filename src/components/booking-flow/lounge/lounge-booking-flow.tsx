import { Button } from '@/components/ui/button'
import { LoungeBookingFlowProps } from '@/utils/types'
import { ArrowLeft } from 'lucide-react'
import React from 'react'

export default function LoungeBookingFlow({ bookingData, setBookingData, currentStep, nextStep, prevStep }: LoungeBookingFlowProps) {
    return (
        <>
            {currentStep === 2 && (
                <div className="flex flex-col gap-6 justify-between h-[468px] lg:h-[468px]">
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold text-title">
                            Lorem ipsum dolor sit amet?
                        </h2>
                        <div className="text-xs md:text-sm text-zinc-500 pt-2">
                            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Doloremque facere, eos ad fuga.
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto relative">

                    </div>
                    <div>
                        <Button className="w-full" disabled={true} onClick={nextStep}>
                            Continue
                        </Button>
                        <Button className="w-full text-foreground" variant={"link"} onClick={prevStep}>
                            <ArrowLeft />
                            Go back
                        </Button>
                    </div>
                </div>
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
