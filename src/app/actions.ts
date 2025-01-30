"use server"

import { otpformSchema } from "@/utils/formSchemas";
import { createClient } from "@/utils/supabase/server";

export async function verifyotp(schoolID: string, clientData: unknown) {
    // server validation
    const result = otpformSchema.safeParse(clientData);

    if (!result.success) {
        return result.error.issues[0].message;
    }

    // try verifying otp and login
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        email: schoolID + "@nscc.ca",
        token: result.data.otp,
        type: 'email',
    });

    if (error?.code == "otp_expired") {
        return "Code has expired or is invalid.";
    } else if (error) {
        console.error(error);
        return "An unexpected error has occured."
    }
}