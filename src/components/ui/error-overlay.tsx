import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorOverlay({ message = "Please try again later" }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-500">
            <AlertCircle className="w-10 h-10 mb-1" />
            <p className="text-2xl font-bold">An error has occured</p>
            <p className="text-zinc-500 mt-2">{message}</p>
        </div>
    );
}
