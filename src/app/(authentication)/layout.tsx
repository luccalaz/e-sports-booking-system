import Header from "@/components/ui/header"
import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center gap-3 p-3">
        {children}
      </div>
    </>
  )
}