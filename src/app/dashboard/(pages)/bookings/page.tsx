import React from 'react'
import BookingsTableContainer from './components/table-container'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

export default function Bookings() {

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground">Manage and view all bookings in the E-Sports Lounge</p>
                </div>
                <Button size="sm" asChild>
                    <Link href={"/book"}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Booking
                    </Link>
                </Button>
            </div>
            <BookingsTableContainer />
        </div >
    )
}
