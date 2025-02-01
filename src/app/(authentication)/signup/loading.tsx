import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="sr-only">Loading</span>
    </>
  )
}