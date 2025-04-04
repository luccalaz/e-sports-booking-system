import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { createClient } from "@/utils/supabase/server"
import DashboardHeader from "./components/dashboard-header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();

    return (
        <>
            <SidebarProvider>
                <DashboardSidebar user={profile} />
                <main className="w-full">
                    <DashboardHeader />
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </>
    )
}