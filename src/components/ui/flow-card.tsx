import type { ReactNode } from "react"
import Image from "next/image"

interface FlowCardProps {
  children?: ReactNode
  img?: string
}

export default function FlowCard({ children, img }: FlowCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-2 w-full max-w-[478px] lg:max-w-[955px]">
      {img && (
        <div className="h-[150px] lg:h-auto relative order-last lg:order-first">
          <Image
            src={img}
            alt="Card image"
            fill
            className="object-cover object-center -z-10"
          />
        </div>
      )}
      <div className={`p-7 ${!img ? "lg:col-span-2" : ""}`}>
        {children}
      </div>
    </div>
  )
}
