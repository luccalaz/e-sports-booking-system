import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { StationBooking } from './data-table'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDuration, getBookingActions, getBookingDisplayStatus, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Clock, Timer, CalendarX, UserX } from 'lucide-react'
import { cancelBooking, markNoShow } from '../actions'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/use-media-query'





export default function BookingCard({ booking, children }: { booking: StationBooking, children: React.ReactNode }) {
    const { displayStatus, badgeVariant } = getBookingDisplayStatus(booking.status, booking.date, booking.duration);
    const actions = getBookingActions(booking.status, booking.date, booking.duration);

    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild className="cursor-pointer">
                    {children}
                </DialogTrigger>
                <DialogContent className="p-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{booking.station}</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(`${booking.booked_by.first_name} ${booking.booked_by.last_name}`)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{`${booking.booked_by.first_name} ${booking.booked_by.last_name}`}</div>
                        </div>
                        <Badge variant={badgeVariant}>{displayStatus}</Badge>
                    </div>
                    <Separator />
                    <div className="border p-4 space-y-4 text-sm w-full">
                        <div className="flex items-center gap-2">
                            <Users className="w-[18px] h-[18px] text-zinc-500" />
                            <div className="text-zinc-500 flex-grow">Type</div>
                            <div>{"Individual"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-[18px] h-[18px] text-zinc-500" />
                            <div className="text-zinc-500 flex-grow">Date</div>
                            <div>
                                {booking.date.toLocaleDateString("en-US", {
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
                                {booking.date.toLocaleTimeString("en-US", {
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
                    {actions.length > 0 && (
                        <DialogClose asChild>
                            <DialogFooter className="flex gap-3">

                                {(actions.includes("cancel") || actions.includes("end")) && (
                                    <Button variant={"destructive"} className="flex-grow" onClick={async () => {
                                        try {
                                            await cancelBooking(booking);
                                            toast.success("Booking cancelled");
                                        } catch (error) {
                                            console.error("Error cancelling booking:", error);
                                        }
                                    }}>
                                        <CalendarX />
                                        Cancel
                                    </Button>
                                )}
                                {actions.includes("noShow") && (
                                    <Button variant={"outline"} className="flex-grow" onClick={async () => {
                                        try {
                                            await markNoShow(booking);
                                            toast.success("Booking marked as no show");
                                        } catch (error) {
                                            console.error("Error marking booking as no show:", error);
                                        }
                                    }}>
                                        <UserX />
                                        No-show
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogClose>
                    )}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild className="cursor-pointer">
                {children}
            </DrawerTrigger>
            <DrawerContent className="p-5 pb-14">
                <DrawerHeader className="mt-5 pl-0">
                    <DrawerTitle className="text-xl font-bold text-left">{booking.station}</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-4">
                    <Separator />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(`${booking.booked_by.first_name} ${booking.booked_by.last_name}`)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{`${booking.booked_by.first_name} ${booking.booked_by.last_name}`}</div>
                        </div>
                        <Badge variant={badgeVariant}>{displayStatus}</Badge>
                    </div>
                    <Separator />
                    <div className="border p-4 space-y-4 text-sm w-full">
                        <div className="flex items-center gap-2">
                            <Users className="w-[18px] h-[18px] text-zinc-500" />
                            <div className="text-zinc-500 flex-grow">Type</div>
                            <div>{"Individual"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-[18px] h-[18px] text-zinc-500" />
                            <div className="text-zinc-500 flex-grow">Date</div>
                            <div>
                                {booking.date.toLocaleDateString("en-US", {
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
                                {booking.date.toLocaleTimeString("en-US", {
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
                    {actions.length > 0 && (
                        <DrawerClose asChild>
                            <DrawerFooter className="flex gap-3 p-0">

                                {(actions.includes("cancel") || actions.includes("end")) && (
                                    <Button variant={"destructive"} className="flex-grow" onClick={async () => {
                                        try {
                                            await cancelBooking(booking);
                                            toast.success("Booking cancelled");
                                        } catch (error) {
                                            console.error("Error cancelling booking:", error);
                                        }
                                    }}>
                                        <CalendarX />
                                        Cancel
                                    </Button>
                                )}
                                {actions.includes("noShow") && (
                                    <Button variant={"outline"} className="flex-grow" onClick={async () => {
                                        try {
                                            await markNoShow(booking);
                                            toast.success("Booking marked as no show");
                                        } catch (error) {
                                            console.error("Error marking booking as no show:", error);
                                        }
                                    }}>
                                        <UserX />
                                        No-show
                                    </Button>
                                )}
                            </DrawerFooter>
                        </DrawerClose>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
