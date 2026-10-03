import { Check, UsersRound, ListTodo } from 'lucide-react'
import { cn } from '../../lib/cn'
import { dueInfo } from '../../lib/format'
import { useUpdateTask } from '../../lib/queries'
import type { Task } from '../../lib/types'
import { useToast } from '../../components/ui/Toaster'

const dueStyles = {
  overdue: 'bg-ember-soft text-ember',
  today: 'bg-sprout-soft text-ink',
  soon: 'bg-pine-soft text-pine',
  later: 'bg-sunken text-muted',
}

export function TaskCheckbox({ task }: { task: Task }) {
  const update = useUpdateTask()
  const toast = useToast()
  const done = task.completedAt !== null
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      onClick={(e) => {
        e.stopPropagation()
        update.mutate(
          { id: task.id, completed: !done },
          { onError: (err) => toast.error(err.message) },
        )
      }}
      className={cn(
        'mt-0.5 flex size-5.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
        done ? 'border-sprout bg-sprout text-white' : 'border-muted/60 hover:border-pine',
      )}
    >
      {done && <Check key="on" className="animate-check size-3.5" strokeWidth={3.5} />}
    </button>
  )
}

interface TaskRowProps {
  task: Task
  /** Shown in cross-list views like Upcoming. */
  context?: { kind: 'list' | 'group'; name: string }
  onOpen: (task: Task) => void
}

export function TaskRow({ task, context, onOpen }: TaskRowProps) {
  const done = task.completedAt !== null
  const due = task.deadline && !done ? dueInfo(task.deadline) : null

  return (
    <li className="group flex items-start gap-3 border-b border-line px-1 py-3 last:border-b-0">
      <TaskCheckbox task={task} />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 text-left"
      >
        <span className={cn('leading-snug', done && 'text-muted line-through decoration-muted/60')}>
          {task.title}
        </span>
        {(task.description || due || context || task.assignedBy) && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {due && (
              <span
                className={cn(
                  'rounded-md px-1.5 py-px text-xs font-semibold',
                  dueStyles[due.state],
                )}
              >
                {due.label}
              </span>
            )}
            {context && (
              <span className="inline-flex items-center gap-1">
                {context.kind === 'group' ? (
                  <UsersRound className="size-3.5" />
                ) : (
                  <ListTodo className="size-3.5" />
                )}
                {context.name}
              </span>
            )}
            {task.assignedBy && !context && <span>Assigned to the whole group</span>}
            {task.description && <span className="line-clamp-1 max-w-md">{task.description}</span>}
          </span>
        )}
      </button>
    </li>
  )
}
