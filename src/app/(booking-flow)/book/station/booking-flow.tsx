"use client"

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, Users } from 'lucide-react'
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
        <div className="flex flex-col gap-6 justify-between max-h-[468px] lg:h-[468px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">What do you want to play?</h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">Select the game station you’d like to book</div>
            </div>
            <div className="h-[320px] overflow-y-auto">
                <RadioGroup defaultValue="individual" className="grid grid-cols-2 gap-2" onValueChange={(value: string) => setBookingData({ ...bookingData, type: value })}>
                    {Array.from({ length: 29 }, (_, i) => (
                        <div key={i + 2}>
                            <RadioGroupItem value={`station${i + 2}`} id={`station${i + 2}`} className="peer sr-only" />
                            <Label htmlFor={`station${i + 2}`} className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <span className="flex-1 text-center">PS5 - Station {i + 2}</span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-3">
                <Button className="w-full" disabled={!bookingData.type}>
                    Continue ({bookingData.type})
                </Button>
            </div>
        </div>

    )

    if (page == 2) return (
        <div className="flex flex-col gap-6 justify-between max-h-[468px] lg:h-[468px]">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold text-title">What are you booking for?</h2>
                <div className="text-xs md:text-sm text-zinc-500 pt-2">Select the option that better matches your case</div>
            </div>
            <ScrollArea className="flex-grow">
                <RadioGroup defaultValue="individual" className="space-y-1">
                    <div>
                        <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                        <Label htmlFor="individual" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                            <User className="h-6 w-6" />
                            <span className="flex-1 text-center">For myself</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="group" id="group" className="peer sr-only" />
                        <Label htmlFor="group" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                            <Users className="h-6 w-6" />
                            <span className="flex-1 text-center">For a group or event</span>
                        </Label>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                        {"If you’re planning an event or have a large group coming, you can request to book off the entire lounge for a period of time."}
                    </div>
                </RadioGroup>
            </ScrollArea>
            <div className="space-y-3">
                <Button type="submit" className="w-full">
                    Continue
                </Button>
            </div>
        </div>
    )
}
