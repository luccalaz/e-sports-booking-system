"use client"

import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React, { useEffect, useState } from 'react'
import { DataTable, StationBooking } from './data-table'
import { getBookingsForDate } from '../actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TableSkeleton from './table-skeleton'

export default function BookingsDataTable() {
    const [date, setDate] = useState<Date>(new Date());
    const [data, setData] = useState<StationBooking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>("all");
    const [type, setType] = useState<string>("stations");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        async function fetchBookings() {
            if (date) {
                const data = await getBookingsForDate(date);
                setData(data);
                setLoading(false);
            }
        }

        fetchBookings();
    }, [date])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col xl:flex-row justify-between gap-3">
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
                loading ? <TableSkeleton /> : <DataTable data={data} filter={filter} searchQuery={searchQuery} />
            )}
            {type === "events" && (
                "Events table"
            )}
        </div>
    )
}
