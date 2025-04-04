import { Button } from '@/components/ui/button'
import { CalendarPlus, CircleSlash } from 'lucide-react'
import React from 'react'
import StationBookingsCard from './components/station-bookings-card'

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="text-2xl font-bold">Welcome</h2>
                <div className="flex items-center gap-3">
                    <Button className="w-full sm:w-fit" size={"sm"}>
                        <CalendarPlus />
                        Book event
                    </Button>
                    <Button variant={"outline"} className="w-full sm:w-fit" size="sm">
                        <CircleSlash />
                        Block station
                    </Button>
                </div>
            </div>
            <StationBookingsCard />
        </div>
    )
}
