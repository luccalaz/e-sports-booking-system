import Logo from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { login } from './actions'

export default function LoginPage() {
  return (
    <div>
      <header className="px-14 h-16 border border-b-2 border-zinc-200">
        <div className="h-full flex justify-between items-center">
          <Logo/>
          <Button variant="link">Login</Button>
        </div>
      </header>
      <main>
        
      </main>
    </div>
  )
}