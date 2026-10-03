import { Megaphone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, FormError, inputClass } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toaster'
import { api } from '../../lib/api'
import { fromDateInput } from '../../lib/format'
import { useGroupAction, useTasks } from '../../lib/queries'
import type { GroupDetail, Task } from '../../lib/types'
import { TaskDialog } from '../tasks/TaskDialog'
import { FilteredView } from '../tasks/TasksPage'

function AssignDialog({
  group,
  open,
  onClose,
}: {
  group: GroupDetail
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  const assign = useGroupAction(
    group.id,
    (body: { title: string; description: string; deadline: string | null }) =>
      api.post<void>(`/groups/${group.id}/tasks`, body),
    [['tasks']],
  )

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    assign.mutate(
      {
        title: String(data.get('title')),
        description: String(data.get('description')),
        deadline: fromDateInput(String(data.get('deadline'))),
      },
      {
        onSuccess: () => {
          toast.success(`Task assigned to all ${group.memberCount} members`)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Assign a task to everyone"
      description={`Each of the ${group.memberCount} members gets their own copy to complete. Every completion grows the SyncTree.`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Title" name="title" required maxLength={120} autoFocus />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assign-description" className="text-sm font-semibold">
            Notes
          </label>
          <textarea
            id="assign-description"
            name="description"
            rows={3}
            maxLength={2000}
            className={`${inputClass} resize-y`}
          />
        </div>
        <Field label="Deadline" name="deadline" type="date" className="max-w-48" />
        <FormError message={assign.error?.message} />
        <Button type="submit" loading={assign.isPending} className="self-end">
          Assign to everyone
        </Button>
      </form>
    </Dialog>
  )
}

export function GroupTasksTab({ group }: { group: GroupDetail }) {
  const tasks = useTasks()
  const [editing, setEditing] = useState<Task | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const mine = (tasks.data ?? []).filter((t) => t.groupId === group.id)

  return (
    <div className="flex flex-col gap-4">
      {group.myStatus === 'owner' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-pine-soft px-4 py-3">
          <p className="text-sm">As the owner you can hand out work to the whole group.</p>
          <Button
            size="sm"
            icon={<Megaphone className="size-4" />}
            onClick={() => setAssignOpen(true)}
          >
            Assign to everyone
          </Button>
        </div>
      )}
      <FilteredView tasks={mine} target={{ groupId: group.id }} onOpen={setEditing} />
      <TaskDialog
        task={editing ? (mine.find((t) => t.id === editing.id) ?? null) : null}
        onClose={() => setEditing(null)}
      />
      {group.myStatus === 'owner' && (
        <AssignDialog group={group} open={assignOpen} onClose={() => setAssignOpen(false)} />
      )}
    </div>
  )
}
