import { isThisWeek, isToday, isPast } from 'date-fns'
import { ArrowUpRight, CalendarClock, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/layout/AppShell'
import { Avatar } from '../../components/ui/Avatar'
import { Button, IconButton, buttonClass } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, FormError } from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toaster'
import { cn } from '../../lib/cn'
import {
  useCreateList,
  useDeleteList,
  useGroups,
  useLists,
  useRenameList,
  useTasks,
} from '../../lib/queries'
import type { GroupSummary, Task, TaskList } from '../../lib/types'
import { AddTask } from './AddTask'
import { TaskDialog } from './TaskDialog'
import { TaskRow } from './TaskRow'

type SortKey = 'created' | 'deadline' | 'title'

const sorters: Record<SortKey, (a: Task, b: Task) => number> = {
  created: (a, b) => a.createdAt.localeCompare(b.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
  deadline: (a, b) => {
    if (a.deadline === b.deadline) return a.createdAt.localeCompare(b.createdAt)
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  },
}

type View =
  { kind: 'upcoming' } | { kind: 'list'; list: TaskList } | { kind: 'group'; group: GroupSummary }

// ---------------------------------------------------------------------------------------------

function ViewLink({
  to,
  active,
  icon,
  label,
  count,
}: {
  to: string
  active: boolean
  icon: ReactNode
  label: string
  count?: number
}) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:shrink',
        active
          ? 'bg-paper text-ink shadow-sm ring-1 ring-line'
          : 'text-muted hover:bg-paper/60 hover:text-ink',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto text-xs tabular-nums text-muted">{count}</span>
      )}
    </Link>
  )
}

function NewListDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (l: TaskList) => void
}) {
  const create = useCreateList()
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const title = String(new FormData(e.currentTarget).get('title'))
    create.mutate(title, {
      onSuccess: (list) => {
        onCreated(list)
        onClose()
      },
    })
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New list"
      description="Lists keep different kinds of work apart."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Name"
          name="title"
          required
          maxLength={60}
          placeholder="e.g. Coursework"
          autoFocus
        />
        <FormError message={create.error?.message} />
        <Button type="submit" loading={create.isPending} className="self-end">
          Create list
        </Button>
      </form>
    </Dialog>
  )
}

function ListActions({ list, onDeleted }: { list: TaskList; onDeleted: () => void }) {
  const rename = useRenameList()
  const remove = useDeleteList()
  const toast = useToast()
  const [mode, setMode] = useState<'rename' | 'delete' | null>(null)

  return (
    <>
      <IconButton label="Rename list" onClick={() => setMode('rename')}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label="Delete list" onClick={() => setMode('delete')}>
        <Trash2 className="size-4" />
      </IconButton>

      <Dialog open={mode === 'rename'} onClose={() => setMode(null)} title="Rename list">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const title = String(new FormData(e.currentTarget).get('title'))
            rename.mutate({ id: list.id, title }, { onSuccess: () => setMode(null) })
          }}
        >
          <Field label="Name" name="title" defaultValue={list.title} required maxLength={60} />
          <FormError message={rename.error?.message} />
          <Button type="submit" loading={rename.isPending} className="self-end">
            Save name
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={mode === 'delete'}
        onClose={() => setMode(null)}
        title={`Delete "${list.title}"?`}
        description="The list and every task in it will be deleted. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setMode(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(list.id, {
                onSuccess: () => {
                  toast.success('List deleted')
                  setMode(null)
                  onDeleted()
                },
              })
            }
          >
            Delete list
          </Button>
        </div>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------------------------

function TaskSection({
  title,
  tasks,
  contextFor,
  onOpen,
  tone,
}: {
  title?: string
  tasks: Task[]
  contextFor?: (t: Task) => { kind: 'list' | 'group'; name: string } | undefined
  onOpen: (t: Task) => void
  tone?: 'ember'
}) {
  if (tasks.length === 0) return null
  return (
    <section className="flex flex-col gap-1">
      {title && (
        <h3 className={cn('text-sm font-semibold', tone === 'ember' ? 'text-ember' : 'text-muted')}>
          {title} <span className="font-normal">({tasks.length})</span>
        </h3>
      )}
      <ul className="rounded-xl border border-line bg-paper px-3">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} context={contextFor?.(t)} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  )
}

function CompletedSection({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  if (tasks.length === 0) return null
  const recent = [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  return (
    <details className="group/details">
      <summary className="cursor-pointer list-none text-sm font-semibold text-muted select-none hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open/details:rotate-90">›</span>{' '}
        Completed ({tasks.length})
      </summary>
      <ul className="mt-2 rounded-xl border border-line bg-paper/60 px-3">
        {recent.map((t) => (
          <TaskRow key={t.id} task={t} onOpen={onOpen} />
        ))}
      </ul>
    </details>
  )
}

function UpcomingView({
  tasks,
  lists,
  groups,
  onOpen,
}: {
  tasks: Task[]
  lists: TaskList[]
  groups: GroupSummary[]
  onOpen: (t: Task) => void
}) {
  const listName = new Map(lists.map((l) => [l.id, l.title]))
  const groupName = new Map(groups.map((g) => [g.id, g.name]))
  const contextFor = (t: Task) =>
    t.listId
      ? { kind: 'list' as const, name: listName.get(t.listId) ?? 'List' }
      : t.groupId
        ? { kind: 'group' as const, name: groupName.get(t.groupId) ?? 'Group' }
        : undefined

  const open = tasks.filter((t) => !t.completedAt).sort(sorters.deadline)
  const buckets = {
    overdue: [] as Task[],
    today: [] as Task[],
    week: [] as Task[],
    later: [] as Task[],
    none: [] as Task[],
  }
  for (const t of open) {
    if (!t.deadline) buckets.none.push(t)
    else {
      const d = new Date(t.deadline)
      if (isToday(d)) buckets.today.push(t)
      else if (isPast(d)) buckets.overdue.push(t)
      else if (isThisWeek(d, { weekStartsOn: 1 })) buckets.week.push(t)
      else buckets.later.push(t)
    }
  }

  if (open.length === 0) {
    return (
      <EmptyState title="Nothing left to do">
        Every task is ticked off. Add something to one of your lists, or check what your groups are
        up to.
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <TaskSection
        title="Overdue"
        tone="ember"
        tasks={buckets.overdue}
        contextFor={contextFor}
        onOpen={onOpen}
      />
      <TaskSection title="Today" tasks={buckets.today} contextFor={contextFor} onOpen={onOpen} />
      <TaskSection title="This week" tasks={buckets.week} contextFor={contextFor} onOpen={onOpen} />
      <TaskSection title="Later" tasks={buckets.later} contextFor={contextFor} onOpen={onOpen} />
      <TaskSection
        title="No due date"
        tasks={buckets.none}
        contextFor={contextFor}
        onOpen={onOpen}
      />
    </div>
  )
}

export function FilteredView({
  tasks,
  target,
  onOpen,
}: {
  tasks: Task[]
  target: { listId: string } | { groupId: string }
  onOpen: (t: Task) => void
}) {
  const [sort, setSort] = useState<SortKey>('deadline')
  const open = tasks.filter((t) => !t.completedAt).sort(sorters[sort])
  const done = tasks.filter((t) => t.completedAt)

  return (
    <div className="flex flex-col gap-5">
      <AddTask target={target} />
      {open.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort by
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer rounded-md border border-line bg-paper px-2 py-1 text-ink"
              >
                <option value="deadline">Due date</option>
                <option value="created">Date added</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>
          <TaskSection tasks={open} onOpen={onOpen} />
        </section>
      ) : (
        <EmptyState title={done.length ? 'All done here' : 'No tasks yet'}>
          {done.length
            ? 'Everything in this list is complete.'
            : 'Add your first task above. Press Enter to save it.'}
        </EmptyState>
      )}
      <CompletedSection tasks={done} onOpen={onOpen} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const tasks = useTasks()
  const lists = useLists()
  const groups = useGroups()
  const [editing, setEditing] = useState<Task | null>(null)
  const [newListOpen, setNewListOpen] = useState(false)

  const memberGroups = useMemo(
    () => (groups.data ?? []).filter((g) => g.myStatus === 'owner' || g.myStatus === 'member'),
    [groups.data],
  )

  const viewParam = params.get('view') ?? 'upcoming'
  const view: View = useMemo(() => {
    const [kind, id] = viewParam.split(':')
    if (kind === 'list') {
      const list = lists.data?.find((l) => l.id === id)
      if (list) return { kind: 'list', list }
    }
    if (kind === 'group') {
      const group = memberGroups.find((g) => g.id === id)
      if (group) return { kind: 'group', group }
    }
    return { kind: 'upcoming' }
  }, [viewParam, lists.data, memberGroups])

  if (tasks.isPending || lists.isPending || groups.isPending) return <PageSpinner />
  if (tasks.isError || lists.isError) {
    return (
      <div className="p-6">
        <EmptyState title="Couldn't load your tasks">
          {(tasks.error ?? lists.error)?.message}
        </EmptyState>
      </div>
    )
  }

  const all = tasks.data
  const openCount = (pred: (t: Task) => boolean) =>
    all.filter((t) => !t.completedAt && pred(t)).length
  const selectedTasks =
    view.kind === 'list'
      ? all.filter((t) => t.listId === view.list.id)
      : view.kind === 'group'
        ? all.filter((t) => t.groupId === view.group.id)
        : all

  const header =
    view.kind === 'upcoming' ? (
      <PageHeader
        title="Upcoming"
        description="Everything on your plate, across your lists and groups."
      />
    ) : view.kind === 'list' ? (
      <PageHeader
        title={view.list.title}
        actions={<ListActions list={view.list} onDeleted={() => setParams({})} />}
      />
    ) : (
      <PageHeader
        title={view.group.name}
        description="Your tasks in this group. Completing them grows the group's SyncTree."
        actions={
          <Link to={`/groups/${view.group.id}`} className={buttonClass('secondary', 'sm')}>
            <ArrowUpRight className="size-4" />
            Open group
          </Link>
        }
      />
    )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
      <nav
        aria-label="Task views"
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-10 lg:mx-0 lg:w-56 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0"
      >
        <ViewLink
          to="?view=upcoming"
          active={view.kind === 'upcoming'}
          icon={<CalendarClock className="size-4" />}
          label="Upcoming"
          count={openCount(() => true)}
        />
        <p className="hidden px-3 pt-4 pb-1 text-xs font-semibold text-muted lg:block">Lists</p>
        {lists.data.map((l) => (
          <ViewLink
            key={l.id}
            to={`?view=list:${l.id}`}
            active={view.kind === 'list' && view.list.id === l.id}
            icon={<ListTodo className="size-4" />}
            label={l.title}
            count={openCount((t) => t.listId === l.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => setNewListOpen(true)}
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-pine hover:bg-paper/60"
        >
          <Plus className="size-4" /> New list
        </button>
        {memberGroups.length > 0 && (
          <p className="hidden px-3 pt-4 pb-1 text-xs font-semibold text-muted lg:block">Groups</p>
        )}
        {memberGroups.map((g) => (
          <ViewLink
            key={g.id}
            to={`?view=group:${g.id}`}
            active={view.kind === 'group' && view.group.id === g.id}
            icon={
              <Avatar kind="group" id={g.id} name={g.name} version={g.avatarVersion} size="xs" />
            }
            label={g.name}
            count={openCount((t) => t.groupId === g.id)}
          />
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {header}
        {view.kind === 'upcoming' ? (
          <UpcomingView tasks={all} lists={lists.data} groups={memberGroups} onOpen={setEditing} />
        ) : (
          <FilteredView
            key={view.kind === 'list' ? view.list.id : view.group.id}
            tasks={selectedTasks}
            target={view.kind === 'list' ? { listId: view.list.id } : { groupId: view.group.id }}
            onOpen={setEditing}
          />
        )}
        {view.kind === 'upcoming' && lists.data.length === 0 && memberGroups.length === 0 && (
          <EmptyState
            title="Start with a list"
            action={
              <Button icon={<Plus className="size-4" />} onClick={() => setNewListOpen(true)}>
                New list
              </Button>
            }
          >
            Lists hold your personal tasks. Join or create a group to share tasks with others.
          </EmptyState>
        )}
      </div>

      <TaskDialog
        task={editing ? (all.find((t) => t.id === editing.id) ?? null) : null}
        onClose={() => setEditing(null)}
      />
      <NewListDialog
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        onCreated={(l) => setParams({ view: `list:${l.id}` })}
      />
    </div>
  )
}
