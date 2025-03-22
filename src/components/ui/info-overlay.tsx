import { Info } from "lucide-react";

export default function InfoOverlay({ message = "Please try again later" }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
            <Info className="w-10 h-10 mb-1" />
            <p className="text-xl font-bold">{message}</p>
        </div>
    );
}
