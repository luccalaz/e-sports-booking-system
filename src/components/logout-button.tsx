"use client"

import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutButton() {
    const router = useRouter();
    
    async function logOut() {
        const client = createClient();
        const { error } = await client.auth.signOut();

        if (!error) {
            router.push("/login");
        } else {
            toast.error("Error logging out. Please try again");
        }
    }

    return (
        <Button onClick={logOut} variant={"destructive"}>Logout</Button>
    )
}