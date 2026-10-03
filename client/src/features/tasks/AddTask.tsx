import { format } from 'date-fns'
import { CalendarDays, Plus } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toaster'
import { cn } from '../../lib/cn'
import { fromDateInput } from '../../lib/format'
import { useCreateTask } from '../../lib/queries'

/** Inline composer: type a title, optionally pick a date, press Enter. */
export function AddTask({ target }: { target: { listId: string } | { groupId: string } }) {
  const create = useCreateTask()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate(
      { ...target, title: title.trim(), deadline: fromDateInput(deadline) },
      {
        onSuccess: () => {
          setTitle('')
          setDeadline('')
          inputRef.current?.focus()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 pl-3 focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20"
    >
      <Plus className="size-5 shrink-0 text-muted" aria-hidden="true" />
      <label htmlFor="new-task" className="sr-only">
        New task
      </label>
      <input
        ref={inputRef}
        id="new-task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task"
        maxLength={120}
        className="min-w-0 flex-1 bg-transparent py-1.5 outline-none placeholder:text-muted/80 focus-visible:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          const el = dateRef.current
          if (!el) return
          try {
            el.showPicker()
          } catch {
            el.focus()
          }
        }}
        className={cn(
          'flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm hover:bg-sunken',
          deadline ? 'text-pine' : 'text-muted',
        )}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          {deadline ? format(new Date(`${deadline}T00:00`), 'd MMM') : 'Due date'}
        </span>
        <span className="sr-only sm:hidden">Due date</span>
      </button>
      <input
        ref={dateRef}
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        aria-label="Due date"
        tabIndex={-1}
        className="pointer-events-none absolute size-px opacity-0"
      />
      <Button type="submit" size="sm" loading={create.isPending} disabled={!title.trim()}>
        Add
      </Button>
    </form>
  )
}
