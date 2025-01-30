import { Button } from '@/components/ui/button'
import Link from "next/link";
import Logo from "./logo";

interface HeaderProps {
    loggedIn?: boolean;
}

export default function Header({ loggedIn = false }: HeaderProps) {
    return (
        <header className="sticky top-0 px-5 lg:px-14 h-16 border border-b border-b-zinc-200 bg-white">
            <div className="h-full flex justify-between items-center">
                <Logo />
                <Button className="text-foreground" variant="link" asChild>
                    <Link href={loggedIn ? "/bookings" : "/login"}>
                        {loggedIn ? "My Bookings" : "Login"}
                    </Link>
                </Button>
            </div>
        </header>
    )
}