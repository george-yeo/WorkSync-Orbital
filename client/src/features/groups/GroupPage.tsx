import { ArrowLeft, Lock, LogOut, MessagesSquare, Sprout, UsersRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Avatar } from '../../components/ui/Avatar'
import { Button, buttonClass } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'
import { Forest, TreeProgress } from '../../components/ui/SyncTree'
import { useToast } from '../../components/ui/Toaster'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { relative } from '../../lib/format'
import { useGroup, useGroupAction } from '../../lib/queries'
import type { GroupDetail } from '../../lib/types'
import { GroupTasksTab } from './GroupTasksTab'
import { MembersTab } from './MembersTab'
import { NotesTab } from './NotesTab'
import { SettingsTab } from './SettingsTab'

type Tab = 'tasks' | 'members' | 'notes' | 'settings'

function treeSentence(g: GroupDetail): string {
  const grown =
    g.tree.grown === 0
      ? 'No trees grown yet.'
      : `${g.tree.grown} ${g.tree.grown === 1 ? 'tree' : 'trees'} grown so far.`
  if (g.tree.isGrowing) return `${grown} Every completed task adds 10% to the one growing now.`
  return `${grown} Plant a new one and finish tasks to make it grow.`
}

function TreePanel({ group }: { group: GroupDetail }) {
  const toast = useToast()
  const plant = useGroupAction(group.id, () => api.post<GroupDetail>(`/groups/${group.id}/tree`))
  const note = group.featuredComment

  return (
    <section
      aria-labelledby="tree-heading"
      className="overflow-hidden rounded-2xl border border-line bg-paper"
    >
      <div className="bg-gradient-to-b from-sky-100/70 to-transparent dark:from-sky-950/30">
        <Forest tree={group.tree} />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:p-6">
        <div className="flex max-w-md flex-1 flex-col gap-3">
          <h2 id="tree-heading" className="text-xl font-semibold">
            SyncTree
          </h2>
          <p className="text-muted">{treeSentence(group)}</p>
          <TreeProgress tree={group.tree} />
          {!group.tree.isGrowing && (
            <Button
              className="self-start"
              icon={<Sprout className="size-4.5" />}
              loading={plant.isPending}
              onClick={() =>
                plant.mutate(undefined, {
                  onSuccess: () => toast.success('Tree planted. Finish tasks to help it grow.'),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Plant a tree
            </Button>
          )}
        </div>
        {note && (
          <figure className="max-w-xs -rotate-1 rounded-lg border border-bark/30 bg-sprout-soft px-4 py-3 shadow-sm">
            <blockquote className="font-display text-lg leading-snug">{note.message}</blockquote>
            <figcaption className="mt-2 text-sm text-muted">
              {note.author.displayName}, {relative(note.createdAt)}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  )
}

function LeaveButton({ group }: { group: GroupDetail }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const leave = useGroupAction(group.id, () => api.post<void>(`/groups/${group.id}/leave`), [
    ['tasks'],
    ['chats'],
  ])
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        icon={<LogOut className="size-4" />}
        onClick={() => setOpen(true)}
      >
        Leave
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Leave ${group.name}?`}
        description="You'll lose access to the group chat, and your tasks in this group will be removed."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Stay
          </Button>
          <Button
            variant="danger"
            loading={leave.isPending}
            onClick={() =>
              leave.mutate(undefined, {
                onSuccess: () => {
                  toast.success(`You left ${group.name}`)
                  navigate('/groups')
                },
              })
            }
          >
            Leave group
          </Button>
        </div>
      </Dialog>
    </>
  )
}

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: Tab; label: string; badge?: number }[]
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Group sections"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
            active === t.id
              ? 'border-pine text-ink'
              : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.label}
          {!!t.badge && (
            <span className="rounded-full bg-sprout px-1.5 text-xs text-ink tabular-nums">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function TabPanel({ id, children }: { id: Tab; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  )
}

export function GroupPage() {
  const { id = '' } = useParams()
  const group = useGroup(id)
  const [params, setParams] = useSearchParams()

  if (group.isPending) return <PageSpinner />
  if (group.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title="This group isn't available"
          action={
            <Link to="/groups" className={buttonClass('secondary')}>
              Back to groups
            </Link>
          }
        >
          It may have been deleted, or you're no longer a member.
        </EmptyState>
      </div>
    )
  }

  const g = group.data
  const isOwner = g.myStatus === 'owner'
  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'members', label: 'Members', badge: isOwner ? g.requests.length : 0 },
    { id: 'notes', label: 'Notes' },
    ...(isOwner ? [{ id: 'settings' as const, label: 'Settings' }] : []),
  ]
  const requested = params.get('tab') as Tab | null
  const active: Tab = tabs.some((t) => t.id === requested) ? requested! : 'tasks'

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Groups
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar kind="group" id={g.id} name={g.name} version={g.avatarVersion} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{g.name}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                {g.isPrivate ? <Lock className="size-3.5" /> : <UsersRound className="size-3.5" />}
                {g.isPrivate ? 'Private group' : 'Public group'}
              </span>
              <span>
                {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
              </span>
              <span>Owned by {isOwner ? 'you' : g.owner.displayName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {g.chatChannelId && (
            <Link to={`/chat?c=${g.chatChannelId}`} className={buttonClass('secondary', 'sm')}>
              <MessagesSquare className="size-4" /> Group chat
            </Link>
          )}
          {!isOwner && <LeaveButton group={g} />}
        </div>
      </header>

      <TreePanel group={g} />

      <div className="flex flex-col gap-5">
        <Tabs
          tabs={tabs}
          active={active}
          onChange={(t) => setParams(t === 'tasks' ? {} : { tab: t }, { replace: true })}
        />
        <TabPanel id={active}>
          {active === 'tasks' && <GroupTasksTab group={g} />}
          {active === 'members' && <MembersTab group={g} />}
          {active === 'notes' && <NotesTab group={g} />}
          {active === 'settings' && isOwner && <SettingsTab group={g} />}
        </TabPanel>
      </div>
    </div>
  )
}
