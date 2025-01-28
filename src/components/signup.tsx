"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from "./ui/button"

const formSchema = z.object({
    firstName: z.string().min(2, {
        message: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
        message: "Last name must be at least 2 characters.",
    }),
    schoolID: z.string().min(2, {
        message: "School ID must be at least 2 characters.",
    }),
})

export default function SignupForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            schoolID: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Create an account</h2>
                    <div className="text-sm text-zinc-500 pt-2">All we need is some basic information for bookings</div>
                </div>
                <div className="flex gap-3">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                                <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                                <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="schoolID" render={({ field }) => (
                    <FormItem>
                        <FormLabel>School ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g W0123456" {...field} />
                        </FormControl>
                        <FormDescription>
                            We need this to verify if you’re associated with NSCC. A one-time verification link will be sent to your NSCC email address.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
                <div>
                    <Button type="submit" className="w-full">Send verification link</Button>

                </div>
            </form>
        </Form>
    )
}
