import FlowCard from '@/components/ui/flow-card'
import Header from '@/components/ui/header'
import LoginPage from './login'

export default async function Login() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center gap-3 p-3">
        <FlowCard img='/images/lounge.jpg'>
          <LoginPage />
        </FlowCard>
        <div className="text-sm text-center text-zinc-500">
          By logging in, you agree to our <a href='#' className='underline'>Terms of Service</a> and <a href='#' className='underline'>Privacy Policy.</a>
        </div>
      </div>
    </>
  )
}