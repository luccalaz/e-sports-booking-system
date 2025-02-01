import FlowCard from '@/components/ui/flow-card'
import SignupForm from '../components/signup-form'

export default async function Signup() {
  return (
    <>
      <FlowCard img='/images/lounge.jpg'>
        <SignupForm />
      </FlowCard>
      <div className="text-sm text-center text-zinc-500">
        By signing up, you agree to our <a href='#' className='underline'>Terms of Service</a> and <a href='#' className='underline'>Privacy Policy.</a>
      </div>
    </>
  )
}