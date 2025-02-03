import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'

export default function page() {
    return (
        <ScrollArea className="max-h-[300px]">
            <RadioGroup defaultValue="individual" className="grid grid-cols-2 gap-2">
                {Array.from({ length: 29 }, (_, i) => (
                    <div key={i + 2}>
                        <RadioGroupItem value={`station${i + 2}`} id={`station${i + 2}`} className="peer sr-only" />
                        <Label htmlFor={`station${i + 2}`} className="h-10 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <span className="flex-1 text-center">PS5 - Station {i + 2}</span>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </ScrollArea>
    )
}