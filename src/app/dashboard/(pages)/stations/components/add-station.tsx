"use client"
import { z } from "zod"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { DialogDescription } from '@radix-ui/react-dialog'
import React from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { stationEditSchema } from "@/lib/formSchemas"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { addStation } from "../actions"

export default function AddStation({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const form = useForm<z.infer<typeof stationEditSchema>>({
        resolver: zodResolver(stationEditSchema),
        defaultValues: {
            name: "",
        },
    })

    async function onSubmit(values: z.infer<typeof stationEditSchema>) {
        const success = await addStation(values.name);
        if (success) toast.success("Station added successfully");
        setOpen(false);
    }

    return (
        <>
            {isDesktop ? (
                <Dialog open={open} onOpenChange={(open) => { setOpen(open); form.reset() }} >
                    <DialogTrigger asChild>
                        {children}
                    </DialogTrigger>
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                <DialogHeader>
                                    <DialogTitle>Add new station</DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground">Create a new gaming station for the E-Sports Lounge.</DialogDescription>
                                </DialogHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Station Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter station name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="flex pt-3">
                                    <Button type="submit" variant="default">
                                        Submit
                                    </Button>
                                    <Button variant="outline" onClick={(e) => { setOpen(false); }}>
                                        Cancel
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={open} onOpenChange={setOpen} onClose={() => form.reset()}>
                    <DrawerTrigger asChild>
                        {children}
                    </DrawerTrigger>
                    <DrawerContent className="p-5 pb-14">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} >
                                <DrawerHeader className="mt-5 pl-0">
                                    <DrawerTitle className="text-xl font-bold text-left">
                                        Add new station
                                    </DrawerTitle>
                                    <DrawerDescription className="text-left">
                                        Create a new gaming station for the E-Sports Lounge.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Station Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter station name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DrawerFooter className="flex gap-3 p-0 pt-7">
                                    <Button type="submit" variant="default">
                                        Submit
                                    </Button>
                                    <Button variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                </DrawerFooter>
                            </form>
                        </Form >
                    </DrawerContent>
                </Drawer >
            )}
        </>
    )
}
