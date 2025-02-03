"use client"

import { useState } from "react"
import { VerificationForm } from "@/app/(authentication)/verification-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button"
import { signup } from "@/app/(authentication)/signup/actions"
import { signupformSchema } from "@/utils/formSchemas"

export default function SignupForm() {
    const [page, setPage] = useState<number>(1);
    const [schoolID, setSchoolID] = useState<string>("");

    const form = useForm<z.infer<typeof signupformSchema>>({
        resolver: zodResolver(signupformSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            schoolID: "",
        },
    })

    async function onSubmit(values: z.infer<typeof signupformSchema>) {
        const error = await signup(values)

        if (error) {
            toast.error(error.message);
        }

        toast.success("Email sent to " + values.schoolID + "@nscc.ca");
        setSchoolID(values.schoolID);
        return setPage(2);
    }

    function onError(errors: object) {
        const firstError = Object.values(errors)[0];
        if (firstError) {
            toast.error(firstError.message);
        }
    }


    if (page == 1) {
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-title">Create an account</h2>
                        <div className="text-sm text-zinc-500 pt-2">All we need is some basic information for bookings</div>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-3">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>First name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" disabled={form.formState.isSubmitting} {...field} />
                                </FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" disabled={form.formState.isSubmitting} {...field} />
                                </FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="schoolID" render={({ field }) => (
                        <FormItem>
                            <FormLabel>School ID</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g W0123456" disabled={form.formState.isSubmitting} {...field} />
                            </FormControl>
                            <FormDescription className="text-xs md:text-sm">
                                We need this to verify if you’re associated with NSCC. A one-time verification code will be sent to your NSCC email address.
                            </FormDescription>
                        </FormItem>
                    )} />
                    <div className="space-y-3">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!form.formState.isValid || form.formState.isSubmitting}
                            loading={form.formState.isSubmitting ? "Sending verification code.." : undefined}
                        >
                            Send verification code
                        </Button>
                        <div className="text-sm text-center mt-">
                            <span>Already have an account? </span>
                            <Link href="/login">
                                <span className="underline">Login</span>
                            </Link>
                        </div>
                    </div>
                </form>
            </Form>
        )
    } else if (page == 2) {
        return (
            <VerificationForm schoolID={schoolID} />
        )
    } else {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    An unexpected error has occured.
                </AlertDescription>
            </Alert>
        );
    }
}