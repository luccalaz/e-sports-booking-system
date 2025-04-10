import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils';

const columnWidths = ["w-24", "w-32", "w-28", "w-40", "w-36", "w-5"];
const rowCount = 5;

export default function TableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table className="table-fixed w-full">
                <TableHeader>
                    <TableRow>
                        {columnWidths.map((width, idx) => (
                            <TableHead key={idx} className={`h-10 ${width}`}>
                                <Skeleton className={`h-4 ${width}`} />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rowCount }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {columnWidths.map((width, colIndex) => (
                                <TableCell key={colIndex} className={cn(width, "h-16")}>
                                    <Skeleton className={`h-4 ${width}`} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
