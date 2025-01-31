import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from '@/components/ui/button'
import { useForm } from "react-hook-form"
import { Mail } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { verifyotp } from '@/app/actions'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { otpformSchema } from '@/utils/formSchemas'

export function VerificationForm({ schoolID, type } : { schoolID : string, type : string}) {
    const otpform = useForm<z.infer<typeof otpformSchema>>({
        resolver: zodResolver(otpformSchema),
        defaultValues: {
            otp: "",
        },
    })

    async function onSubmitOtp(values: z.infer<typeof otpformSchema>) {
        const error = await verifyotp(schoolID, values);

        if (error) {
            return toast.error(error);
        }

        toast.success("Logged in successfully");
        return redirect("/");
    }

    function onError(errors: object) {
        const firstError = Object.values(errors)[0];
        if (firstError) {
            toast.error(firstError.message);
        }
    }

    return (
        <Form {...otpform}>
            <form onSubmit={otpform.handleSubmit(onSubmitOtp, onError)} className="space-y-6 flex flex-col justify-center">
                <div className="flex flex-col items-center">
                    <Mail className="text-title" size={50} />
                    <h2 className="text-2xl text-title font-bold mt-1">{type == "login" ? "Check your email" : "Verify your account"}</h2>
                    <div className="text-sm text-center text-zinc-500 pt-2">Type in the code sent to your NSCC email to continue</div>
                </div>
                <FormField control={otpform.control} name="otp" render={({ field }) => (
                    <FormItem className="flex justify-center">
                        <FormControl>
                            <InputOTP autoFocus maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </FormControl>
                    </FormItem>
                )} />
                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!otpform.formState.isValid || otpform.formState.isSubmitting} 
                    loading={otpform.formState.isSubmitting ? (type == "login" ? "Logging in..." : "Verifying account...") : undefined}>
                    {type == "login" ? "Login" : "Verify account"}
                </Button>
            </form>
        </Form >
    )
}