"use server"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/server";
import { Booking } from "@/lib/types";
import InfoOverlay from "@/components/ui/info-overlay";
import { getUserBookings } from "../../server-actions";
import UserBooking from "../../components/user-booking";


export default async function Bookings() {
    const supabase = await createClient();
    const now = new Date();
    const { data: { user } } = await supabase.auth.getUser();
    const bookings: Booking[] = await getUserBookings(user!.id);

    // Split bookings into upcoming and past
    const upcomingBookings = bookings.filter((booking) => now < booking.end_timestamp);
    const pastBookings = bookings.filter((booking) => now >= booking.end_timestamp);

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
                            Upcoming ({upcomingBookings.length})
                        </TabsTrigger>
                        <TabsTrigger value="past">
                            Past ({pastBookings.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent
                        value="upcoming"
                        className="h-[60vh] overflow-auto mt-5"
                        style={{ scrollbarGutter: "stable" }}
                    >
                        {upcomingBookings.length === 0 ? (
                            <InfoOverlay message="No bookings found" />
                        ) : (
                            <div className="flex flex-col gap-5">
                                {upcomingBookings.map((booking) => (
                                    <UserBooking {...booking} key={booking.id} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent
                        value="past"
                        className="h-[60vh] overflow-auto mt-5"
                        style={{ scrollbarGutter: "stable" }}
                    >
                        {pastBookings.length === 0 ? (
                            <InfoOverlay message="No bookings found" />
                        ) : (
                            <div className="flex flex-col gap-5">
                                {pastBookings.map((booking) => (
                                    <UserBooking {...booking} key={booking.id} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}