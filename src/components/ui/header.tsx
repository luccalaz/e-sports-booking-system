import { Button } from '@/components/ui/button'
import Link from "next/link";
import Logo from "./logo";
import { ModeToggle } from './mode-toggle';
import LogoutButton from './logout-button';

interface HeaderProps {
    loggedIn?: boolean;
}

export default function Header({ loggedIn = false }: HeaderProps) {
    return (
        <header className="sticky top-0 px-3 md:px-14 h-16 border-b bg-background">
            <div className="h-full flex justify-between items-center">
                <Logo />
                <div className="flex gap-3">
                    <Button className="text-foreground" variant="link" asChild>
                        <Link href={loggedIn ? "/bookings" : "/login"}>
                            {loggedIn ? "My Bookings" : "Login"}
                        </Link>
                    </Button>
                    <ModeToggle />
                    <LogoutButton />
                </div>
            </div>
        </header>
    )
}