import { z } from "zod";

export const otpformSchema = z.object({
    otp: z.string().nonempty({
        message: "The code is required to verify.",
    }).min(6).max(6),
})

export const signupformSchema = z.object({
    firstName: z.string().nonempty({
        message: "First name is required.",
    }).max(50, {
        message: "First name is too long.",
    }).regex(/^[A-Za-z\s]+$/, {
        message: "First name should only contain letters and spaces.",
    }).refine((value) => value.trim().length > 0, {
        message: "First name cannot be empty or just spaces.",
    }),
    lastName: z.string().nonempty({
        message: "Last name is required.",
    }).max(50, {
        message: "Last name is too long.",
    }).regex(/^[A-Za-z\s]+$/, {
        message: "Last name should only contain letters and spaces.",
    }).refine((value) => value.trim().length > 0, {
        message: "Last name cannot be empty or just spaces.",
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