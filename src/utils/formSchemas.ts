import { z } from "zod";

export const otpformSchema = z.object({
    otp: z.string().min(2, {
        message: "The code is required to verify.",
    }).max(6),
})

export const signupformSchema = z.object({
    firstName: z.string().nonempty({
        message: "First name is required.",
    }).max(50, { 
        message: "First name is too long.",
    }),
    lastName: z.string().nonempty({
        message: "Last name is required.",
    }).max(50, { 
        message: "Last name is too long.",
    }),
    schoolID: z.string().nonempty({
        message: "School ID is required.",
    }).regex(/^w\d{7}$/i, {
        message: "Invalid school ID.",
    }),
})

export const loginformSchema = z.object({
    schoolID: z.string().nonempty({
        message: "School ID is required.",
    }).regex(/^w\d{7}$/i, {
        message: "Invalid school ID.",
    }),
})