"use client"

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false)

    async function logOut() {
        setLoading(true);

        toast.promise(
            async () => {
                const client = createClient();
                const { error } = await client.auth.signOut();

                if (error) throw error;

                router.push("/login");
            },
            {
                loading: 'Signing out...',
                success: 'Signed out successfully',
                error: 'Error signing out. Please try again',
            }
        );
    }

    return (
        <Button
            onClick={logOut}
            disabled={loading}
            variant={"outline"}
            size={"icon"}
            className="text-destructive"
        >
            <LogOut />
        </Button>
    )
}