"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date) => void
    className?: string
    placeholder?: string
}

export function DatePicker({ date, setDate, className, placeholder = "Pick a date" }: DatePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !date && "text-muted-foreground", className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                        if (selectedDate) {
                            setDate(selectedDate)
                        }
                        setOpen(false)
                    }}
                    required
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
