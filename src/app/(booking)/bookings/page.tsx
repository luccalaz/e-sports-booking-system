"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { getMyBookings } from "../booking";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { UserBooking } from "@/lib/types";
import LoadingOverlay from "@/components/ui/loading-overlay";
import InfoOverlay from "@/components/ui/info-overlay";

export default function Bookings() {
    const [bookings, setBookings] = useState<UserBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchBookings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const bookingsData = await getMyBookings(user.id);
            setBookings(bookingsData);
            setLoading(false);
        };

        fetchBookings();
    });

    return (
        <Card className="w-full max-w-4xl relative">
            <CardHeader>
                <CardTitle className="text-title font-bold">My bookings</CardTitle>
                <CardDescription>View and manage your e-sports lounge bookings</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="upcoming">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upcoming">
                            Upcoming ({bookings.filter(booking => booking.display.date_status === "upcoming").length})
                        </TabsTrigger>
                        <TabsTrigger value="past">
                            Past ({bookings.filter(booking => booking.display.date_status === "past").length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="h-[60vh] overflow-auto mt-5" style={{ scrollbarGutter: "stable" }}>
                        {loading ? (
                            <LoadingOverlay />
                        ) : bookings.filter(booking => booking.display.date_status === "upcoming").length === 0 ? (
                            <InfoOverlay message="No bookings found" />
                        ) : (
                            <div className="flex flex-col gap-5">
                                {bookings
                                    .filter(booking => booking.display.date_status === "upcoming")
                                    .map(booking => (
                                        <Card key={booking.id} className="p-5 flex gap-5">
                                            <div className="flex-grow flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-title text-xl font-bold">
                                                        {booking.station?.name || booking.name}
                                                    </div>
                                                    <Badge
                                                        className="h-5"
                                                        variant={
                                                            booking.display.badge as "default" | "destructive" | "outline" | "secondary" | "warning" | "success"
                                                        }
                                                    >
                                                        {booking.display.status}
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
                                                            {booking.start_timestamp?.toLocaleDateString("en-US", {
                                                                weekday: "long",
                                                                month: "long",
                                                                day: "numeric"
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-[18px] h-[18px] text-zinc-500" />
                                                        <div className="text-zinc-500 flex-grow">Time</div>
                                                        <div>
                                                            {booking.start_timestamp?.toLocaleTimeString("en-US", {
                                                                hour: "numeric",
                                                                minute: "numeric"
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Timer className="w-[18px] h-[18px] text-zinc-500" />
                                                        <div className="text-zinc-500 flex-grow">Duration</div>
                                                        <div>{formatDuration(booking.duration)}</div>
                                                    </div>
                                                </div>
                                                {!["cancelled", "denied"].includes(booking.status) && booking.display.status !== "In-progress" && (
                                                    <Button variant={"destructive"}>Cancel booking</Button>
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
                                    ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="past" className="h-[60vh] overflow-auto mt-5" style={{ scrollbarGutter: "stable" }}>
                        {loading ? (
                            <LoadingOverlay />
                        ) : bookings.filter(booking => booking.display.date_status === "past").length === 0 ? (
                            <InfoOverlay message="No bookings found" />
                        ) : (
                            <div className="flex flex-col gap-5">
                                {bookings
                                    .filter(booking => booking.display.date_status === "past")
                                    .map(booking => (
                                        <Card key={booking.id} className="p-5 flex gap-5">
                                            <div className="flex-grow flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-title text-xl font-bold">
                                                        {booking.station?.name || booking.name}
                                                    </div>
                                                    <Badge
                                                        className="h-5"
                                                        variant={
                                                            booking.display.badge as "default" | "destructive" | "outline" | "secondary" | "warning" | "success"
                                                        }
                                                    >
                                                        {booking.display.status}
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
                                                            {booking.start_timestamp?.toLocaleDateString("en-US", {
                                                                weekday: "long",
                                                                month: "long",
                                                                day: "numeric"
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-[18px] h-[18px] text-zinc-500" />
                                                        <div className="text-zinc-500 flex-grow">Time</div>
                                                        <div>
                                                            {booking.start_timestamp?.toLocaleTimeString("en-US", {
                                                                hour: "numeric",
                                                                minute: "numeric"
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Timer className="w-[18px] h-[18px] text-zinc-500" />
                                                        <div className="text-zinc-500 flex-grow">Duration</div>
                                                        <div>{formatDuration(booking.duration)}</div>
                                                    </div>
                                                </div>
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
                                    ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
