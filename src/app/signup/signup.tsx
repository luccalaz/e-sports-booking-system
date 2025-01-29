"use client"

import { useState } from "react"
import { toast } from "sonner"
import { VerificationForm } from "@/components/verification-form"
import SignupForm from "@/components/signup-form";

export default function SignupPage() {
    const [page, setPage] = useState<number>(1);
    const [schoolID, setSchoolID] = useState<string>("");

    if (page == 1) {
        return (
            <SignupForm setPage={setPage} setSchoolID={setSchoolID} />
        )
    } else if (page == 2) {
        return (
            <VerificationForm schoolID={schoolID} type="login" />
        )
    } else {
        toast.error("An unexpected error has occured.");
        return <></>;
    }
}