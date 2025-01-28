import FlowCard from '@/components/ui/flow-card'
import Header from '@/components/ui/header'

export default function LoginPage() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <FlowCard img='/images/gaming-lounge.jpg'>
          Hello
        </FlowCard>
      </div>
    </>
  )
}