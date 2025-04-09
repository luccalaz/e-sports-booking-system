import React from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

export default async function BookingsHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
                <p className="text-muted-foreground">Manage and view all station bookings in the E-Sports Lounge</p>
            </div>
            {/* <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Booking
            </Button> */}
        </div>
    )
}
