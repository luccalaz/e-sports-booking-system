import { Loader2 } from 'lucide-react'
import React from 'react'

export default function LoadingOverlay() {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="sr-only">Loading</span>
        </div>
    )
}
