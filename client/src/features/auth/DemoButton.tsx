import { Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormError } from '../../components/ui/Field'
import { useSessionMutation } from './useAuthForm'

export function DemoButton() {
  const demo = useSessionMutation<Record<string, never>>('/auth/demo')
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="md"
        className="h-12 w-full text-base"
        icon={<Sparkles className="size-4.5" />}
        loading={demo.isPending}
        onClick={() => demo.mutate({})}
      >
        Explore the demo
      </Button>
      <p className="text-center text-sm text-muted">
        No sign-up. You get a private sandbox with sample groups, tasks and chats.
      </p>
      <FormError message={demo.error?.message} />
    </div>
  )
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
