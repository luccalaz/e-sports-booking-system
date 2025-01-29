"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { VerificationForm } from "@/components/verification-form"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
    const [page, setPage] = useState<number>(1);
    const [schoolID, setSchoolID] = useState<string>("");

    useEffect(() => {
        console.log(">>> VAR UPDATED: " + page + " and " + schoolID)
    }, [page, schoolID]);

    if (page == 1) {
        return (
            <LoginForm setPage={setPage} setSchoolID={setSchoolID}/>
        )
    } else if (page == 2) {
        return (
            <VerificationForm schoolID={schoolID} type="login"/>
        )
    } else {
        toast.error("An unexpected error has occured.");
        return <></>;
    }
}
