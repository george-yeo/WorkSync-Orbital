import { Lock, Plus, Search, UsersRound } from 'lucide-react'
import { useDeferredValue, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '../../components/layout/AppShell'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, FormError, inputClass } from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'
import { ForestCount, TreeProgress } from '../../components/ui/SyncTree'
import { useToast } from '../../components/ui/Toaster'
import { fieldErrorsOf } from '../../lib/api'
import {
  useCreateGroup,
  useGroupSearch,
  useGroups,
  useInvites,
  useJoinRequest,
  useRespondToInvite,
} from '../../lib/queries'
import type { GroupSummary } from '../../lib/types'

function GroupMeta({ group }: { group: GroupSummary }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      <span className="inline-flex items-center gap-1">
        {group.isPrivate ? <Lock className="size-3.5" /> : <UsersRound className="size-3.5" />}
        {group.isPrivate ? 'Private' : 'Public'}
      </span>
      <span>
        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
      </span>
      <ForestCount grown={group.tree.grown} />
    </span>
  )
}

function JoinAction({ group }: { group: GroupSummary }) {
  const join = useJoinRequest()
  const toast = useToast()
  const onError = (e: Error) => toast.error(e.message)
  switch (group.myStatus) {
    case 'owner':
    case 'member':
      return (
        <Link
          to={`/groups/${group.id}`}
          className="text-sm font-semibold text-pine hover:underline"
        >
          Open
        </Link>
      )
    case 'requested':
      return (
        <Button
          variant="secondary"
          size="sm"
          loading={join.isPending}
          onClick={() => join.mutate({ groupId: group.id, cancel: true }, { onError })}
        >
          Cancel request
        </Button>
      )
    case 'invited':
      return <span className="text-sm text-muted">Invited, see above</span>
    default:
      return group.isPrivate ? (
        <span className="text-sm text-muted">Invite only</span>
      ) : (
        <Button
          size="sm"
          loading={join.isPending}
          onClick={() =>
            join.mutate(
              { groupId: group.id },
              {
                onSuccess: () => toast.success(`Request sent to ${group.owner.displayName}`),
                onError,
              },
            )
          }
        >
          Ask to join
        </Button>
      )
  }
}

function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateGroup()
  const navigate = useNavigate()
  const errors = fieldErrorsOf(create.error)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    create.mutate(
      { name: String(data.get('name')), isPrivate: data.get('visibility') === 'private' },
      { onSuccess: (g) => navigate(`/groups/${g.id}`) },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create a group"
      description="Groups share tasks, a chat and a SyncTree."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field
          label="Group name"
          name="name"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9][A-Za-z0-9 \-]*"
          hint="3-30 characters: letters, numbers, spaces and hyphens"
          error={errors.name}
          autoFocus
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Who can join?</legend>
          {[
            { value: 'private', title: 'Invite only', body: 'People join when you invite them.' },
            {
              value: 'public',
              title: 'Anyone can ask',
              body: 'The group shows up in search and people can request to join.',
            },
          ].map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 has-checked:border-pine has-checked:bg-pine-soft"
            >
              <input
                type="radio"
                name="visibility"
                value={o.value}
                defaultChecked={o.value === 'private'}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold">{o.title}</span>
                <span className="block text-sm text-muted">{o.body}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <FormError message={errors.name ? null : create.error?.message} />
        <Button type="submit" loading={create.isPending} className="self-end">
          Create group
        </Button>
      </form>
    </Dialog>
  )
}

function Invites() {
  const invites = useInvites()
  const respond = useRespondToInvite()
  const toast = useToast()
  const navigate = useNavigate()
  if (!invites.data?.length) return null
  return (
    <section className="flex flex-col gap-2" aria-labelledby="invites-heading">
      <h2 id="invites-heading" className="text-lg font-semibold">
        Invitations
      </h2>
      <ul className="flex flex-col gap-2">
        {invites.data.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-sprout/60 bg-sprout-soft px-4 py-3"
          >
            <Avatar kind="group" id={g.id} name={g.name} version={g.avatarVersion} />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{g.owner.displayName}</span> invited you to join{' '}
              <span className="font-semibold">{g.name}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={respond.isPending}
                onClick={() =>
                  respond.mutate(
                    { groupId: g.id, accept: false },
                    { onSuccess: () => toast.success('Invitation declined') },
                  )
                }
              >
                Decline
              </Button>
              <Button
                size="sm"
                loading={
                  respond.isPending &&
                  respond.variables?.groupId === g.id &&
                  respond.variables.accept
                }
                onClick={() =>
                  respond.mutate(
                    { groupId: g.id, accept: true },
                    {
                      onSuccess: () => {
                        toast.success(`You joined ${g.name}`)
                        navigate(`/groups/${g.id}`)
                      },
                      onError: (e) => toast.error(e.message),
                    },
                  )
                }
              >
                Join group
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GroupRow({ group }: { group: GroupSummary }) {
  return (
    <li className="flex items-center gap-4 border-b border-line py-4 last:border-b-0">
      <Avatar
        kind="group"
        id={group.id}
        name={group.name}
        version={group.avatarVersion}
        size="lg"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-3">
          {group.myStatus === 'owner' || group.myStatus === 'member' ? (
            <Link
              to={`/groups/${group.id}`}
              className="font-display text-lg font-semibold hover:text-pine"
            >
              {group.name}
            </Link>
          ) : (
            <span className="font-display text-lg font-semibold">{group.name}</span>
          )}
          {group.myStatus === 'owner' && (
            <span className="text-xs font-semibold text-pine">You own this</span>
          )}
        </div>
        <GroupMeta group={group} />
        {group.tree.isGrowing && (group.myStatus === 'owner' || group.myStatus === 'member') && (
          <div className="max-w-xs">
            <TreeProgress tree={group.tree} />
          </div>
        )}
      </div>
      <JoinAction group={group} />
    </li>
  )
}

export function GroupsPage() {
  const groups = useGroups()
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim())
  const search = useGroupSearch(deferred)

  const mine = groups.data?.filter((g) => g.myStatus === 'owner' || g.myStatus === 'member') ?? []
  const pending = groups.data?.filter((g) => g.myStatus === 'requested') ?? []

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <PageHeader
        title="Groups"
        description="Work towards shared goals and grow a SyncTree together."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
            Create group
          </Button>
        }
      />

      <Invites />

      <section className="flex flex-col gap-3" aria-labelledby="find-heading">
        <h2 id="find-heading" className="sr-only">
          Find a group
        </h2>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a group by name"
            aria-label="Find a group by name"
            className={`${inputClass} pl-10`}
          />
        </div>
        {deferred && (
          <div className="rounded-xl border border-line bg-paper px-4">
            {search.isPending ? (
              <PageSpinner />
            ) : search.data?.length ? (
              <ul>
                {search.data.map((g) => (
                  <GroupRow key={g.id} group={g} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-muted">No groups start with "{deferred}".</p>
            )}
          </div>
        )}
      </section>

      {!deferred && (
        <section className="flex flex-col gap-2" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="text-lg font-semibold">
            Your groups
          </h2>
          {groups.isPending ? (
            <PageSpinner />
          ) : mine.length ? (
            <ul className="rounded-xl border border-line bg-paper px-4">
              {mine.map((g) => (
                <GroupRow key={g.id} group={g} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="You're not in any groups yet"
              action={
                <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
                  Create group
                </Button>
              }
            >
              Create one and invite people, or search above for a public group to join.
            </EmptyState>
          )}
          {pending.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-muted">Waiting for approval</h3>
              <ul className="rounded-xl border border-line bg-paper px-4">
                {pending.map((g) => (
                  <GroupRow key={g.id} group={g} />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <CreateGroupDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
