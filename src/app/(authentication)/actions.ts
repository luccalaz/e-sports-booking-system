"use server"

import { otpformSchema } from "@/utils/formSchemas";
import { createClient } from "@/utils/supabase/server";

export async function verifyotp(schoolID: string, clientData: unknown) {
    // server validation
    const result = otpformSchema.safeParse(clientData);

    if (!result.success) {
        return {
            code: 'VALIDATION_ERROR',
            message: result.error.issues[0].message
        };
    }

    // try verifying otp and login
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        email: schoolID + "@nscc.ca",
        token: result.data.otp,
        type: 'email',
    });

    if (error?.code == "otp_expired") {
        return {
            code: 'CODE_INVALID',
            message: "Code has expired or is invalid."
        };
    } else if (error) {
        console.error(error);
        return {
            code: 'AUTH_ERROR',
            message: "An unexpected error has occurred."
        };
    }
}