import Image from 'next/image'

export default function Logo() {
  return (
    <div className="w-28 flex flex-col select-none">
        <Image src="/images/nscc-logo.jpg" width={96} height={23} alt='NSCC Logo'/>
        <div className="text-sm text-zinc-500">E-Sports Lounge</div>
    </div>
  )
}