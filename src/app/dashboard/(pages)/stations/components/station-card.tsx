"use client"

import React from 'react'
import Image from 'next/image'
import { Station } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { setStationStatus } from '../actions'
import { toast } from 'sonner'

export function StationCard({ station }: { station: Station }) {
    const router = useRouter()
    const [active, setActive] = React.useState(station.status === "available")
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

    const handleToggle = async (checked: boolean) => {
        const success = await setStationStatus(station.id, checked ? "available" : "unavailable")
        if (!success) toast.error("There was a problem updating the station's status")
        if (success) setActive(checked);
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "available":
                return <Badge variant={"success"}>Available</Badge>
            case "unavailable":
                return <Badge variant={"destructive"}>Unavailable</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    return (
        <>
            <Card className="overflow-hidden">
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={station.img_url || "/images/lounge.jpg"}
                        alt={station.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className={`transition-opacity ${active ? "" : "opacity-50 grayscale"}`}
                    />
                    <div className="absolute right-2 top-2">{getStatusBadge(active ? "available" : "unavailable")}</div>
                </div>

                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{station.name}</h3>
                        <div className="flex items-center gap-2">
                            <Switch checked={active} onCheckedChange={handleToggle} />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-muted/50 p-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/stations/${station.id}`)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                    </Button>

                </CardFooter>
            </Card>
        </>
    )
}
