import { ModeToggle } from '@/components/ui/mode-toggle';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import AppBreadcrumb from './dashboard-breadcrumb';

export default function DashboardHeader() {

    return (
        <header className="sticky top-0 w-full px-6 h-16 border-b bg-background z-10">
            <div className="h-full flex justify-between items-center">
                <div className="flex justify-center items-center gap-3">
                    <SidebarTrigger className="scale-110" />
                    <Separator orientation="vertical" className="h-6 text-primary-foreground mr-1" />
                    <AppBreadcrumb />
                </div>
                <div className="flex gap-3">
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}