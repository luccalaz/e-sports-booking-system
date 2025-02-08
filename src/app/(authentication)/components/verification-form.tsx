import { useState } from "react";
import { useForm } from "react-hook-form";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyotp } from "@/app/(authentication)/actions";
import { otpformSchema } from "@/lib/formSchemas";


export function VerificationForm({ schoolID }: { schoolID: string }) {
    const [loading, setLoading] = useState<boolean>(false);

    const otpform = useForm<z.infer<typeof otpformSchema>>({
        resolver: zodResolver(otpformSchema),
        defaultValues: {
            otp: "",
        },
    })

    async function onSubmitOtp(values: z.infer<typeof otpformSchema>) {
        setLoading(true);
        const error = await verifyotp(schoolID, values);

        if (error) {
            setLoading(false);
            return toast.error(error.message);
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
                    <h2 className="text-2xl text-title font-bold mt-1">Check your email</h2>
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
                    disabled={!otpform.formState.isValid || loading}
                    loading={loading ? "Logging in..." : undefined}
                >
                    Login
                </Button>
            </form>
        </Form >
    )
}