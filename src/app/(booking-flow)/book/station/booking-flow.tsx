"use client"

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

export default function StationBookingFlow() {
    const [page, setPage] = useState<number>(1);
    const [bookingData, setBookingData] = useState({
        type: 'individual',
        station: '',
        date: '',
        time: '',
        duration: '',
        eventName: '',
        eventDescription: ''
    });

    const loadPageData = () => {

    }

    if (page == 1) return (
        <div className="flex flex-col gap-6 justify-between h-[468px] lg:h-[468px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">
                    What do you want to play?
                </h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">
                    Select the game station you’d like to book
                </div>
            </div>
            <div className="flex-grow overflow-y-auto relative">
                <RadioGroup
                    defaultValue="individual"
                    className="grid grid-cols-2 gap-2"
                    onValueChange={(value: string) =>
                        setBookingData({ ...bookingData, station: value })
                    }
                >
                    {Array.from({ length: 20 }, (_, i) => (
                        <div key={i + 1}>
                            <RadioGroupItem
                                value={`station${i + 1}`}
                                id={`station${i + 1}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`station${i + 1}`}
                                className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                                <span className="flex-1 text-center">
                                    PS5 - Station {i + 1}
                                </span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div>
                <Button className="w-full" disabled={!bookingData.station}>
                    Continue
                </Button>
                <Button className="w-full text-foreground" variant={"link"} asChild>
                    <Link href="/book">
                        <ArrowLeft />
                        Go back
                    </Link>
                </Button>
            </div>
        </div>


    )
}
