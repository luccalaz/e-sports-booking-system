"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Logo from "@/components/ui/logo"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { User } from "@/lib/types"
import { capitalizeFirstLetter, getInitials } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { CalendarRange, ChevronsUpDown, Gamepad2, LayoutDashboard, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

export function DashboardSidebar({ user }: { user: User }) {
    const route = usePathname();
    const router = useRouter();
    const { setOpenMobile } = useSidebar();

    async function logOut() {
        toast.promise(
            async () => {
                const client = createClient();
                const { error } = await client.auth.signOut();

                if (error) throw error;

                router.push("/login");
            },
            {
                loading: 'Logging you out...',
                success: 'Logged out successfully!',
                error: 'Error logging out. Please try again',
            }
        );
    }

    return (
        <Sidebar>
            <SidebarHeader className="h-16 flex justify-center items-center border-b">
                <Logo />
            </SidebarHeader>
            <SidebarContent className="mt-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={route === "/dashboard/bookings"} onClick={() => setOpenMobile(false)}>
                                    <Link href="/dashboard/bookings">
                                        <CalendarRange />
                                        <span>Bookings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={route === "/dashboard/stations"} onClick={() => setOpenMobile(false)}>
                                    <Link href="/dashboard/stations">
                                        <Gamepad2 />
                                        <span>Stations</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={route === "/dashboard/settings"} onClick={() => setOpenMobile(false)}>
                                    <Link href="/dashboard/settings">
                                        <Settings />
                                        <span>Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg">{getInitials(`${user.first_name} ${user.last_name}`)}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.first_name} {user.last_name}</span>
                                        <span className="truncate text-xs">{capitalizeFirstLetter(user.role)}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={"bottom"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="text-red-700" onClick={logOut}>
                                        <LogOut />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
