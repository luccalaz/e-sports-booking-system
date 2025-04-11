"use client"

import React from 'react'
import Image from 'next/image'
import { Station } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { deleteStation, editStation, setStationStatus } from '../actions'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useForm } from 'react-hook-form'
import { stationEditSchema } from '@/lib/formSchemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from 'zod'
import { Input } from '@/components/ui/input'

export function StationCard({ station }: { station: Station }) {
    const router = useRouter();
    const active = station.status === "available";
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [showEditDialog, setShowEditDialog] = React.useState(false);

    const handleToggle = async (checked: boolean) => {
        const success = await setStationStatus(station.id, checked ? "available" : "unavailable");
        if (!success) return toast.error("There was a problem updating the station's status");
    }

    function getStatusBadge() {
        switch (station.status) {
            case "available":
                return <Badge variant={"success"}>Available</Badge>
            case "unavailable":
                return <Badge variant={"destructive"}>Unavailable</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    return (
        <>
            <Card className="overflow-hidden">
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={station.img_url || "/images/lounge.jpg"}
                        alt={station.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className={`transition-opacity ${active ? "" : "opacity-50 grayscale"}`}
                    />
                    <div className="absolute right-2 top-2">{getStatusBadge()}</div>
                </div>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{station.name}</h3>
                        <div className="flex items-center gap-2">
                            <Switch checked={active} onCheckedChange={handleToggle} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/50 p-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                    </Button>
                </CardFooter>
            </Card>

            <EditStationDialog station={station} open={showEditDialog} onOpenChange={setShowEditDialog} />
            <DeleteStationDialog station={station} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
        </>
    )
}


interface StationDialogProps {
    station: Station
    open: boolean
    onOpenChange: (open: boolean) => void
}

function DeleteStationDialog({ station, open, onOpenChange }: StationDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    async function handleDelete() {
        const success = await deleteStation(station.id);
        if (!success) return toast.error("There was a problem deleting the station.");
        toast.success("Station deleted successfully!");
    }

    return (
        <>
            {isDesktop ? (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {station.name}? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={open} onOpenChange={onOpenChange}>
                    <DrawerContent className="p-5 pb-14">
                        <DrawerHeader className="mt-5 pl-0">
                            <DrawerTitle className="text-xl font-bold text-left">Are you absolutely sure?</DrawerTitle>
                            <DrawerDescription className="text-left">
                                Are you sure you want to delete {station.name}? This action cannot be undone.
                            </DrawerDescription>
                        </DrawerHeader>
                        <DrawerFooter className="flex gap-3 p-0">
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )}
        </>
    )
}


function EditStationDialog({ station, open, onOpenChange }: StationDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const form = useForm<z.infer<typeof stationEditSchema>>({
        resolver: zodResolver(stationEditSchema),
        defaultValues: {
            name: station.name,
        },
    })

    async function onSubmit(values: z.infer<typeof stationEditSchema>) {
        const success = await editStation(station.id, values.name);
        if (success) toast.success("Station edited successfully");
        if (!success) toast.error("There was a problem editing the station")
        onOpenChange(false);
    }

    return (
        <>
            {isDesktop ? (
                <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); form.reset() }} >
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                <DialogHeader>
                                    <DialogTitle>Edit new station</DialogTitle>
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
                                    <Button variant="outline" onClick={() => { onOpenChange(false); }}>
                                        Cancel
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={open} onOpenChange={onOpenChange} onClose={() => form.reset()}>
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
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>
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
