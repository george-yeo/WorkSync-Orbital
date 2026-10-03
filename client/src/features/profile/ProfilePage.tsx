import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, useMe } from '../../auth/AuthProvider'
import { PageHeader } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, FormError } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toaster'
import { api, fieldErrorsOf } from '../../lib/api'
import { useAvatarUpload, useUpdateMe } from '../../lib/queries'
import { useMutation } from '@tanstack/react-query'
import { PasswordToggle } from '../auth/PasswordToggle'
import { ImagePicker } from './ImagePicker'

function Card({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function ProfileForm() {
  const me = useMe()
  const update = useUpdateMe()
  const toast = useToast()
  const errors = fieldErrorsOf(update.error)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    update.mutate(
      {
        displayName: String(data.get('displayName')),
        username: String(data.get('username')),
        ...(me.isGuest ? {} : { email: String(data.get('email')) }),
      },
      { onSuccess: () => toast.success('Profile saved') },
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Display name"
        name="displayName"
        defaultValue={me.displayName}
        required
        maxLength={40}
        error={errors.displayName}
      />
      <Field
        label="Username"
        name="username"
        defaultValue={me.username}
        required
        pattern="[A-Za-z0-9_]{4,20}"
        hint="4-20 letters, numbers or underscores"
        error={errors.username}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={me.email}
        required
        disabled={me.isGuest}
        hint={me.isGuest ? "Demo accounts can't change their email." : undefined}
        error={errors.email}
        className="sm:col-span-2"
      />
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <FormError message={Object.keys(errors).length ? null : update.error?.message} />
        <Button type="submit" loading={update.isPending} className="ml-auto">
          Save profile
        </Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [shown, setShown] = useState(false)
  const change = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.put<void>('/me/password', body),
  })
  const errors = fieldErrorsOf(change.error)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    change.mutate(
      {
        currentPassword: String(data.get('currentPassword')),
        newPassword: String(data.get('newPassword')),
      },
      {
        onSuccess: () => {
          form.reset()
          toast.success('Password changed')
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Current password"
        name="currentPassword"
        type={shown ? 'text' : 'password'}
        autoComplete="current-password"
        required
        error={errors.currentPassword}
      />
      <Field
        label="New password"
        name="newPassword"
        type={shown ? 'text' : 'password'}
        autoComplete="new-password"
        required
        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}"
        hint="8+ characters with upper and lower case letters and a number"
        error={errors.newPassword}
        trailing={<PasswordToggle shown={shown} onToggle={() => setShown((s) => !s)} />}
      />
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <FormError message={Object.keys(errors).length ? null : change.error?.message} />
        <Button type="submit" variant="secondary" loading={change.isPending} className="ml-auto">
          Change password
        </Button>
      </div>
    </form>
  )
}

function DeleteAccount() {
  const me = useMe()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const remove = useMutation({
    mutationFn: (password: string) => api.delete<void>('/me', { password }),
  })

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} className="self-start">
        Delete my account
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        description="Your lists, tasks, messages and any groups you own will be permanently deleted."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const password = String(new FormData(e.currentTarget).get('password') ?? '')
            remove.mutate(password, {
              onSuccess: () => {
                logout()
                navigate('/login')
              },
            })
          }}
        >
          {!me.isGuest && (
            <Field
              label="Confirm with your password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
          <FormError message={remove.error?.message} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" loading={remove.isPending}>
              Delete everything
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

export function ProfilePage() {
  const me = useMe()
  const avatar = useAvatarUpload()
  const toast = useToast()
  const onError = (e: Error) => toast.error(e.message)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <PageHeader title="Profile" description={`Signed in as @${me.username}`} />
      <Card title="Picture">
        <ImagePicker
          kind="user"
          id={me.id}
          name={me.displayName}
          version={me.avatarVersion}
          busy={avatar.isPending}
          onPick={(file) =>
            avatar.mutate(file, { onSuccess: () => toast.success('Picture updated'), onError })
          }
          onRemove={() =>
            avatar.mutate(null, { onSuccess: () => toast.success('Picture removed'), onError })
          }
        />
      </Card>
      <Card title="Details">
        <ProfileForm />
      </Card>
      {!me.isGuest && (
        <Card title="Password">
          <PasswordForm />
        </Card>
      )}
      <Card
        title="Delete account"
        description="Permanently remove your account and everything you've created."
      >
        <DeleteAccount />
      </Card>
    </div>
  )
}
