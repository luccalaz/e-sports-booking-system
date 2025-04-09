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
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { CalendarX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

// Define the booking data type
export type StationBooking = {
    id: string;
    date: Date;
    duration: string;
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
        header: "Time",
        cell: ({ row }) => {
            const date = row.getValue("date") as Date
            return <div>{format(date, "h:mm a")}</div>
        },
    },
    {
        accessorKey: "duration",
        header: "Duration",
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
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">{initials}</AvatarFallback>
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
            const now = new Date();

            let statusLabel = "Unknown";
            let badgeVariant: "default" | "outline" | "destructive" | "secondary" | "warning" = "outline";

            if (booking.status === "cancelled") {
                statusLabel = "Cancelled";
                badgeVariant = "destructive";
            } else if (booking.status === "noshow") {
                statusLabel = "No-show";
                badgeVariant = "warning";
            } else if (booking.status === "confirmed") {
                const start = booking.date;
                const end = new Date(start.getTime() + parseInt(booking.duration) * 60000);

                if (now < start) {
                    statusLabel = "Upcoming";
                    badgeVariant = "default";
                } else if (now >= start && now < end) {
                    statusLabel = "In-progress";
                    badgeVariant = "outline";
                } else if (now >= end) {
                    statusLabel = "Ended";
                    badgeVariant = "outline";
                }
            }

            return (
                <Badge variant={badgeVariant} className="capitalize">
                    {statusLabel}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        meta: {
            className: "w-16", // 👈 Tailwind width class for column cell and head
        },
        cell: ({ row }) => {
            const booking = row.original

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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(booking.id)}>
                                Copy booking ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit booking</DropdownMenuItem>
                            {booking.status !== "cancelled" && (
                                <DropdownMenuItem className="text-red-600">Cancel booking</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]

interface BookingsDataTableProps {
    data: StationBooking[]
    filter: string
    searchQuery: string
}

export function DataTable({ data, filter, searchQuery }: BookingsDataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
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
                result = result.filter((booking) => now < new Date(booking.date.getTime() + parseInt(booking.duration) * 60000));
            } else if (filter === "past") {
                result = result.filter((booking) => now >= new Date(booking.date.getTime() + parseInt(booking.duration) * 60000));
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
        getPaginationRowModel: getPaginationRowModel(),
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
                <Table className="table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn("h-10", (header.column.columnDef.meta as { className?: string })?.className)}
                                        >
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
                                        <TableCell
                                            key={cell.id}
                                            className={cn((cell.column.columnDef.meta as { className?: string })?.className)}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
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
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}