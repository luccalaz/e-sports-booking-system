import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import React from 'react'

export default function Stations() {

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Stations</h1>
                    <p className="text-muted-foreground">Manage gaming stations in the E-Sports Lounge</p>
                </div>
                <Button size="sm">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Station
                </Button>
            </div>

        </div >
    )
}
