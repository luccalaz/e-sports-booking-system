import { Button } from '@/components/ui/button'
import Link from "next/link";
import Logo from "./logo";
import { ModeToggle } from './mode-toggle';

interface HeaderProps {
    loggedIn?: boolean;
}

export default function Header({ loggedIn = false }: HeaderProps) {
    return (
        <header className="sticky top-0 px-5 lg:px-14 h-16 border border-b bg-background">
            <div className="h-full flex justify-between items-center">
                <Logo />
                <div className="flex gap-1">
                    <Button className="text-foreground" variant="link" asChild>
                        <Link href={loggedIn ? "/bookings" : "/login"}>
                            {loggedIn ? "My Bookings" : "Login"}
                        </Link>
                    </Button>
                    <ModeToggle/>
                </div>
            </div>
        </header>
    )
}