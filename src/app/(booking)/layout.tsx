import Header from "@/components/ui/header"
import type React from "react"

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header loggedIn />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center gap-3 p-3">
        {children}
      </div>
    </>
  )
}