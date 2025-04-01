"use server"

import { capitalizeFirstLetter } from "@/lib/utils";
import { loginformSchema, otpformSchema, signupformSchema } from "@/lib/formSchemas";
import { createClient } from "@/utils/supabase/server";

export async function login(clientData: unknown) {
    // server validation
    const result = loginformSchema.safeParse(clientData);

    if (!result.success) {
        return {
            code: 'VALIDATION_ERROR',
            message: result.error.issues[0].message
        };
    }

    const formData = result.data;

    // check if user exists
    const supabase = await createClient();
    const { data } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

    if (!data || data.length == 0) {
        return {
            code: 'USER_NOT_FOUND',
            message: "User doesn't exist. Please sign up."
        };
    }

    // try login
    const { error } = await supabase.auth.signInWithOtp({
        email: formData.schoolID + '@nscc.ca',
        options: {
            shouldCreateUser: false,
        }
    });

    // error if any
    if (error) {
        console.error(error);
        return {
            code: 'AUTH_ERROR',
            message: "An unexpected error has occurred."
        };
    }
}

export async function signup(clientData: unknown) {
    // server validation
    const result = signupformSchema.safeParse(clientData);

    if (!result.success) {
        return {
            code: 'VALIDATION_ERROR',
            message: result.error.issues[0].message
        };
    }

    const formData = result.data;

    // try sign up
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
        email: formData.schoolID + "@nscc.ca",
        options: {
            data: {
                first_name: capitalizeFirstLetter(formData.firstName),
                last_name: capitalizeFirstLetter(formData.lastName),
                nscc_id: formData.schoolID.toUpperCase(),
            },
        }
    })

    // error if any
    if (error) {
        console.error(error);
        return {
            code: 'AUTH_ERROR',
            message: "An unexpected error has occurred."
        };
    }
}

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