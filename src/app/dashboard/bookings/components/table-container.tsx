"use client"

import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React, { useEffect, useState } from 'react'
import { BookingsDataTable, StationBooking } from './data-table'
import { getBookingsForDate } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TableSkeleton from './table-skeleton'
import { createClient } from '@/utils/supabase/client'

export default function BookingsTableContainer() {
    const [date, setDate] = useState<Date>(new Date());
    const [data, setData] = useState<StationBooking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>("all");
    const [type, setType] = useState<string>("stations");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        async function fetchBookings() {
            const data = await getBookingsForDate(date);
            setData(data);
            setLoading(false);
        }

        async function refreshBookings() {
            const refreshedData = await getBookingsForDate(date)
            setData(refreshedData)
        }

        fetchBookings();

        const supabase = createClient();
        // Create a channel for changes to the "station_bookings" table.
        const channel = supabase
            .channel("public:station_bookings") // name your channel (suggested: include schema and table)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'station_bookings'
                },
                () => refreshBookings()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [date])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col xl:flex-row justify-between gap-5">
                <Tabs value={type} onValueChange={(t) => setType(t)} className="w-full md:w-60">
                    <TabsList className="w-full">
                        <TabsTrigger value="stations" className="flex-grow">Stations</TabsTrigger>
                        <TabsTrigger value="events" className="flex-grow">Events</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <div className="flex flex-grow gap-3">
                        <Input
                            type="text"
                            placeholder="Search bookings.."
                            className="w-full xl:w-60"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select value={filter} onValueChange={(v) => setFilter(v)}>
                            <SelectTrigger className="min-w-32 w-32">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Past</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DatePicker date={date} setDate={setDate} className="flex-grow lg:flex-grow-0 lg:w-52" />
                </div>
            </div>
            {type === "stations" && (
                loading ? <TableSkeleton /> : <BookingsDataTable data={data} filter={filter} searchQuery={searchQuery} />
            )}
            {type === "events" && (
                <TableSkeleton />
            )}
        </div>
    )
}
