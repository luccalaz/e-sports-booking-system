import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="sr-only">Loading</span>
    </div>
  )
}