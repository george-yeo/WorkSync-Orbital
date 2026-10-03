import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, FormError, inputClass } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toaster'
import { fromDateInput, relative, toDateInput } from '../../lib/format'
import { useDeleteTask, useUpdateTask } from '../../lib/queries'
import type { Task } from '../../lib/types'

export function TaskDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return (
    <Dialog open={task !== null} onClose={onClose} title="Edit task">
      {task && <TaskEditor key={task.id} task={task} onClose={onClose} />}
    </Dialog>
  )
}

function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    update.mutate(
      {
        id: task.id,
        title: String(data.get('title')),
        description: String(data.get('description')),
        deadline: fromDateInput(String(data.get('deadline'))),
      },
      {
        onSuccess: () => {
          toast.success('Task saved')
          onClose()
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Title" name="title" defaultValue={task.title} required maxLength={120} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-description" className="text-sm font-semibold">
          Notes
        </label>
        <textarea
          id="task-description"
          name="description"
          defaultValue={task.description}
          rows={3}
          maxLength={2000}
          className={`${inputClass} resize-y`}
        />
      </div>
      <Field
        label="Deadline"
        name="deadline"
        type="date"
        defaultValue={toDateInput(task.deadline)}
        className="max-w-48"
      />
      <p className="text-xs text-muted">
        Created {relative(task.createdAt)}
        {task.completedAt && `, completed ${relative(task.completedAt)}`}
      </p>
      <FormError message={update.error?.message ?? remove.error?.message} />
      <div className="flex items-center justify-between gap-2 pt-1">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(task.id, {
                  onSuccess: () => {
                    toast.success('Task deleted')
                    onClose()
                  },
                })
              }
            >
              Delete task
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        )}
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
