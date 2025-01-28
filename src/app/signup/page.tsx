import SignupForm from '@/components/signup'
import FlowCard from '@/components/ui/flow-card'
import Header from '@/components/ui/header'

export default function SignupPage() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center gap-3">
        <FlowCard img='/images/gaming-lounge.jpg'>
          <SignupForm/>
        </FlowCard>
        <div className="text-sm text-zinc-500">By signing up, you agree to our Terms of Service and Privacy Policy.</div>
      </div>
    </>
  )
}