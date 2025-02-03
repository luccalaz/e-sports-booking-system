"use client"

import FlowCard from "@/components/ui/flow-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [type, setType] = useState('station');

  return (
    <>
      <FlowCard img='/images/lounge.jpg'>
        <div className="flex flex-col gap-6 justify-between max-h-[468px] lg:h-[468px]">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-title">What are you booking for?</h2>
            <div className="text-xs md:text-sm text-zinc-500 pt-2">Select the option that better matches your case</div>
          </div>
          <ScrollArea className="flex-grow">
            <RadioGroup defaultValue="station" className="space-y-1" onValueChange={(value: string) => setType(value)}>
              <div>
                <RadioGroupItem value="station" id="station" className="peer sr-only" />
                <Label htmlFor="station" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <User className="h-6 w-6" />
                  <span className="flex-1 text-center">For myself</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="lounge" id="lounge" className="peer sr-only" />
                <Label htmlFor="lounge" className="h-14 flex flex-row items-center rounded-md border-2 p-4 border-muted bg-popover cursor-pointer select-none md:hover:bg-accent md:hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Users className="h-6 w-6" />
                  <span className="flex-1 text-center">For a group or event</span>
                </Label>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {"If you’re planning an event or have a large group coming, you can request to book off the entire lounge for a period of time."}
              </div>
            </RadioGroup>
          </ScrollArea>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/book/${type}`}>Continue</Link>
            </Button>
          </div>
        </div>
      </FlowCard>
      <div className="text-center">
        <div className="text-xs md:text-sm text-center text-zinc-500 max-w-[476px] lg:max-w-full">
          By booking, you agree to our <a href='#' className='underline'>Terms of Service</a> and <a href='#' className='underline'>Privacy Policy</a>, as well as the <a href='#' className='underline'>no-show policy</a>
        </div>
      </div>
    </>
  );
}
