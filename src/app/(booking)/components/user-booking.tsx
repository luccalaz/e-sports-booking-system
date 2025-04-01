"use client"

import React, { useState } from 'react'
import Image from "next/image";
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Booking } from '@/lib/types'
import { cancelBooking, getBookingActions, getDisplayStatus } from '../client-actions';
import { Calendar, Clock, Timer, Users } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function UserBooking(booking: Booking) {
    const display = getDisplayStatus(booking);
    const actions = getBookingActions(booking);
    const [loading, setLoading] = useState<boolean>(false);

    const router = useRouter();

    const onCancel = async () => {
        setLoading(true);
        const success = await cancelBooking(booking);
        if (success) {
            toast.success("Booking cancelled successfully!");
            router.refresh();
        } else {
            toast.error("Error when cancelling booking. Please try again later.");
            setLoading(false);
        }
    }

    return (
        <Card key={booking.id} className="p-5 flex gap-5">
            <div className="flex-grow flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div className="text-title text-xl font-bold">
                        {booking.station?.name || booking.name}
                    </div>
                    <Badge
                        className="h-5"
                        variant={
                            display.badge as
                            | "default"
                            | "destructive"
                            | "outline"
                            | "secondary"
                            | "warning"
                            | "success"
                        }
                    >
                        {display.status}
                    </Badge>
                </div>
                <div className="border p-4 space-y-4 text-sm w-full">
                    <div className="flex items-center gap-2">
                        <Users className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Type</div>
                        <div>{booking.station ? "Individual" : "Group / Event"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Date</div>
                        <div>
                            {booking.start_timestamp.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Time</div>
                        <div>
                            {booking.start_timestamp.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Timer className="w-[18px] h-[18px] text-zinc-500" />
                        <div className="text-zinc-500 flex-grow">Duration</div>
                        <div>{formatDuration(booking.duration)}</div>
                    </div>
                </div>
                {actions.includes("cancel") && (
                    <Button
                        variant={"destructive"}
                        disabled={loading}
                        loading={loading ? "" : undefined}
                        onClick={onCancel}
                    >
                        Cancel booking
                    </Button>
                )}
            </div>
            <div className="relative w-[200px] hidden sm:block">
                <Image
                    src={booking.station?.img_url || "/images/lounge.jpg"}
                    alt="Card image"
                    fill
                    className="object-cover"
                />
            </div>
        </Card>
    )
}
