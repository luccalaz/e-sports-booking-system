"use server"

import { createClient } from "@/utils/supabase/server";


export async function verifyotp(schoolID: string, otp: string) {
    const supabase = await createClient();

    // type-casting here for convenience
    // in practice, you should validate your inputs

    const { error } = await supabase.auth.verifyOtp({
        email: schoolID + "@nscc.ca",
        token: otp,
        type: 'email',
    });

    if (error && error.code == "otp_expired") {
        return "Code has expired or is invalid.";
    } else if (error) {
        return "An unexpected error has occured."
    }
}