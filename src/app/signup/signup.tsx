"use client"

import { useState } from "react"
import { VerificationForm } from "@/components/verification-form"
import SignupForm from "@/components/signup-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SignupPage() {
    const [page, setPage] = useState<number>(1);
    const [schoolID, setSchoolID] = useState<string>("");

    if (page == 1) {
        return (
            <SignupForm setPage={setPage} setSchoolID={setSchoolID} />
        )
    } else if (page == 2) {
        return (
            <VerificationForm schoolID={schoolID}/>
        )
    } else {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    An unexpected error has occured.
                </AlertDescription>
            </Alert>
        );
    }
}