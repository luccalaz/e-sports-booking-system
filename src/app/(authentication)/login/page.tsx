import FlowCard from '@/components/ui/flow-card'
import LoginForm from '../components/login-form'

export default async function Login() {
  return (
    <>
      <FlowCard img='/images/lounge.jpg'>
        <LoginForm />
      </FlowCard>
      <div className="text-xs md:text-sm text-center text-zinc-500">
        By logging in, you agree to our <a href='#' className='underline'>Terms of Service</a> and <a href='#' className='underline'>Privacy Policy.</a>
      </div>
    </>
  )
}