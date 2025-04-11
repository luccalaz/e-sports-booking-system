import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/book" className="w-28 flex flex-col select-none gap-1">
      <Image src="/images/nscc-logo.png" width={96} height={22} alt='NSCC Logo' />
      <div className="text-xs text-muted-foreground">E-Sports Lounge</div>
    </Link>
  )
}