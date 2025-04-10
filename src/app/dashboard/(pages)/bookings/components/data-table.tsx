"use client"

import * as React from "react"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { CalendarOff, CalendarX, ChevronDown, ChevronUp, MoreHorizontal, UserX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDuration, getBookingActions, getBookingDisplayStatus, getInitials } from "@/lib/utils"
import { cancelBooking, markNoShow } from "../actions"
import { toast } from "sonner"
import BookingCard from "./booking-card"

// Define the booking data type
export type StationBooking = {
    id: string;
    date: Date;
    duration: number;
    station: string;
    booked_by: {
        first_name: string;
        last_name: string;
    };
    status: "confirmed" | "cancelled" | "noshow";
};

type ColumnMeta = {
    className?: string;
};

export type StationBookingColumnDef<TData = StationBooking> = ColumnDef<TData, unknown> & {
    meta?: ColumnMeta;
};

// Define the columns
export const columns: StationBookingColumnDef[] = [
    {
        accessorKey: "date",
        enableSorting: true, // enable sorting for this column
        sortingFn: "datetime", // use built‑in date sorting
        header: ({ column }) => {
            const sortState = column.getIsSorted();
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 pl-3"
                    onClick={() => column.toggleSorting(sortState === "asc")}
                >
                    Time
                    {sortState === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                    ) : sortState === "desc" ? (
                        <ChevronDown className="ml-1 h-4 w-4" />
                    ) : (
                        // When unsorted we treat it as ascending by default
                        <ChevronUp className="ml-1 h-4 w-4" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => {
            const date = row.getValue("date") as Date;
            return <div>{format(date, "h:mm a")}</div>;
        },
    },
    {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
            return (
                <div>{formatDuration(row.original.duration)}</div>
            )
        }
    },
    {
        accessorKey: "station",
        header: "Station",
    },
    {
        accessorKey: "booked_by",
        header: "Booker",
        cell: ({ row }) => {
            const booked_by = row.getValue("booked_by") as StationBooking["booked_by"]
            const name = `${booked_by.first_name} ${booked_by.last_name}`
            const initials = getInitials(name)

            return (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <span>{name}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const booking = row.original;
            const { displayStatus, badgeVariant } = getBookingDisplayStatus(booking.status, booking.date, booking.duration);

            return <Badge variant={badgeVariant}>{displayStatus}</Badge>;
        },
    },
    {
        id: "actions",
        meta: {
            className: "w-16",
        },
        cell: ({ row }) => {
            const booking = row.original;
            const actions = getBookingActions(booking.status, booking.date, booking.duration);

            // Then, render the actions conditionally:
            return (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <MoreHorizontal className="h-4 w-4" />
                                View details
                            </DropdownMenuItem>

                            {(actions.includes("cancel") || actions.includes("end")) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                await cancelBooking(booking);
                                                toast.success("Booking cancelled");
                                            } catch (error) {
                                                console.error("Error cancelling booking:", error);
                                            }
                                        }}
                                    >
                                        <CalendarOff className="h-4 w-4" />
                                        Cancel
                                    </DropdownMenuItem>
                                </>
                            )}

                            {actions.includes("noShow") && (
                                <>
                                    {!(actions.includes("cancel") || actions.includes("end")) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                await markNoShow(booking);
                                                toast.success("Booking marked as no-show");
                                            } catch (error) {
                                                console.error("Error marking as no-show:", error);
                                            }
                                        }}
                                    >
                                        <UserX className="h-4 w-4" />
                                        No show
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }
]

interface BookingsDataTableProps {
    data: StationBooking[]
    filter: string
    searchQuery: string
}

export function BookingsDataTable({ data, filter, searchQuery }: BookingsDataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: false }])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    // Filter data according to props
    const filteredData = React.useMemo(() => {
        let result = [...data]

        // Filter by status
        if (filter !== "all") {
            const now = new Date();
            if (filter === "upcoming") {
                result = result.filter((booking) => now < new Date(booking.date.getTime() + booking.duration * 60000));
            } else if (filter === "past") {
                result = result.filter((booking) => now >= new Date(booking.date.getTime() + booking.duration * 60000));
            }
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (booking) =>
                    booking.booked_by.first_name.toLowerCase().includes(query) ||
                    booking.booked_by.last_name.toLowerCase().includes(query) ||
                    booking.station.toLowerCase().includes(query) ||
                    booking.id.toLowerCase().includes(query),
            )
        }

        return result
    }, [data, filter, searchQuery])

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-10">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="">
                                    {row.getVisibleCells().map((cell) => (
                                        <BookingCard key={cell.id} booking={cell.row.original}>
                                            <TableCell className="text-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        </BookingCard>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <CalendarX className="w-12 h-12 mb-4 opacity-60" />
                                        <p className="text-sm">No bookings found for this day.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}