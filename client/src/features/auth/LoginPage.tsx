import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Field, FormError } from '../../components/ui/Field'
import { AuthLayout } from './AuthLayout'
import { DemoButton, OrDivider } from './DemoButton'
import { PasswordToggle } from './PasswordToggle'
import { useSessionMutation } from './useAuthForm'

export function LoginPage() {
  const login = useSessionMutation<{ email: string; password: string }>('/auth/login')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    login.mutate({ email: String(data.get('email')), password: String(data.get('password')) })
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted">
            New here?{' '}
            <Link
              to="/signup"
              className="font-semibold text-pine underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <DemoButton />
        <OrDivider label="or log in" />

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            trailing={
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />
            }
          />
          <FormError message={login.error?.message} />
          <Button type="submit" variant="secondary" loading={login.isPending} className="w-full">
            Log in
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
