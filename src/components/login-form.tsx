"use client"

import { Dispatch, SetStateAction } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from "@/app/login/actions"
import { loginformSchema } from "@/utils/formSchemas"

export default function LoginForm({ setSchoolID, setPage } : { setSchoolID : Dispatch<SetStateAction<string>>, setPage : Dispatch<SetStateAction<number>> }) {

    const form = useForm<z.infer<typeof loginformSchema>>({
        resolver: zodResolver(loginformSchema),
        defaultValues: {
            schoolID: "",
        },
    })

    async function onSubmit(values: z.infer<typeof loginformSchema>) {
        const error = await login(values)

        if (error) {
            return toast.error(error);
        }

        toast.success("Email sent to " + values.schoolID + "@nscc.ca")
        setSchoolID(values.schoolID);
        return setPage(2);
    }

    function onError(errors: object) {
        const firstError = Object.values(errors)[0];
        if (firstError) {
            toast.error(firstError.message);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-title">Welcome back</h2>
                    <div className="text-sm text-zinc-500 pt-2">Enter your school ID to login and start booking</div>
                </div>
                <FormField control={form.control} name="schoolID" render={({ field }) => (
                    <FormItem>
                        <FormLabel>School ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g W0123456" {...field} />
                        </FormControl>
                    </FormItem>
                )} />
                <div className="space-y-3">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={!form.formState.isValid  || form.formState.isSubmitting}
                        loading={form.formState.isSubmitting ? "Sending login code.." : undefined}
                    >
                        Send login code
                    </Button>
                    <div className="text-sm text-center mt-">
                        <span>First time booking? </span>
                        <Link href="/signup">
                            <span className="underline">Sign up</span>
                        </Link>
                    </div>
                </div>
            </form>
        </Form>
    )
}