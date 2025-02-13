import Image from 'next/image'

export default function Logo() {
  return (
    <div className="w-28 flex flex-col select-none gap-1">
        <Image src="/images/nscc-logo.png" width={96} height={22} alt='NSCC Logo'/>
        <div className="text-xs text-zinc-500">E-Sports Lounge</div>
    </div>
  )
}