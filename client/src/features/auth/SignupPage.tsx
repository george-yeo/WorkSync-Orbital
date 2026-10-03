import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Field, FormError } from '../../components/ui/Field'
import { AuthLayout } from './AuthLayout'
import { DemoButton, OrDivider } from './DemoButton'
import { PasswordToggle } from './PasswordToggle'
import { fieldErrors, useSessionMutation } from './useAuthForm'

// Mirrors the server rules (server/src/modules/users/user.schemas.ts) for instant feedback.
const USERNAME_PATTERN = '[A-Za-z0-9_]{4,20}'
const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,72}'

export function SignupPage() {
  const signup = useSessionMutation<{ email: string; username: string; password: string }>(
    '/auth/signup',
  )
  const [showPassword, setShowPassword] = useState(false)
  const errors = fieldErrors(signup.error)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    signup.mutate({
      email: String(data.get('email')),
      username: String(data.get('username')),
      password: String(data.get('password')),
    })
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="text-muted">
            Already have one?{' '}
            <Link
              to="/login"
              className="font-semibold text-pine underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Username"
            name="username"
            autoComplete="username"
            required
            pattern={USERNAME_PATTERN}
            hint="4-20 characters: letters, numbers or underscores"
            error={errors.username}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
          />
          <Field
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            pattern={PASSWORD_PATTERN}
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number"
            error={errors.password}
            trailing={
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />
            }
          />
          <FormError message={Object.keys(errors).length ? null : signup.error?.message} />
          <Button type="submit" loading={signup.isPending} className="w-full">
            Create account
          </Button>
        </form>

        <OrDivider label="or" />
        <DemoButton />
      </div>
    </AuthLayout>
  )
}
