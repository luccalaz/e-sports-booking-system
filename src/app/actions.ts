"use server"

import { createClient } from "@/utils/supabase/server";


export async function verifyotp(schoolID: string, otp: string) {
    const supabase = await createClient();

    // type-casting here for convenience
    // in practice, you should validate your inputs

    const { data, error } = await supabase.auth.verifyOtp({
        email: schoolID + "@nscc.ca",
        token: otp,
        type: 'email',
    });

    if (error) {
        return error;
    }

    return data;
}