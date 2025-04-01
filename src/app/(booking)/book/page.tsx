"use client"

import FlowCard from "@/components/ui/flow-card";
import BookingFlow from "../components/booking-flow";
import { useState } from "react";

export default function Home() {
    const [image, setImage] = useState<string>("")

    return (
        <>
            <FlowCard img={image || "/images/lounge.jpg"}>
                <BookingFlow setImage={setImage} />
            </FlowCard>
            <div className="text-center">
                <div className="text-xs md:text-sm text-center text-zinc-500 max-w-[476px] lg:max-w-full">
                    By booking, you agree to our <a href='#' className='underline'>Terms of Service</a> and <a href='#' className='underline'>Privacy Policy</a>, as well as the <a href='#' className='underline'>no-show policy</a>
                </div>
            </div>
        </>
    );
}
