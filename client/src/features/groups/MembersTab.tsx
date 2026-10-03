import { Search } from 'lucide-react'
import { useDeferredValue, useState, type ReactNode } from 'react'
import { useMe } from '../../auth/AuthProvider'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toaster'
import { api } from '../../lib/api'
import { useGroupAction, useUserSearch } from '../../lib/queries'
import type { GroupDetail, PublicUser } from '../../lib/types'
import { useRealtime } from '../../realtime/SocketProvider'

function PersonRow({
  user,
  note,
  children,
}: {
  user: PublicUser
  note?: ReactNode
  children?: ReactNode
}) {
  const { online } = useRealtime()
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <Avatar
        id={user.id}
        name={user.displayName}
        version={user.avatarVersion}
        online={online.has(user.id)}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {user.displayName} {note}
        </p>
        <p className="truncate text-sm text-muted">@{user.username}</p>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </li>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function useMemberActions(group: GroupDetail) {
  const toast = useToast()
  const onError = (e: Error) => toast.error(e.message)
  const base = `/groups/${group.id}`
  return {
    kick: useGroupAction(group.id, (u: PublicUser) =>
      api.delete<GroupDetail>(`${base}/members/${u.id}`),
    ),
    approve: useGroupAction(group.id, (u: PublicUser) =>
      api.post<GroupDetail>(`${base}/requests/${u.id}/approve`),
    ),
    reject: useGroupAction(group.id, (u: PublicUser) =>
      api.post<GroupDetail>(`${base}/requests/${u.id}/reject`),
    ),
    invite: useGroupAction(group.id, (u: PublicUser) =>
      api.post<GroupDetail>(`${base}/invites`, { userId: u.id }),
    ),
    revoke: useGroupAction(group.id, (u: PublicUser) =>
      api.delete<GroupDetail>(`${base}/invites/${u.id}`),
    ),
    onError,
    toast,
  }
}

function KickButton({ user, group }: { user: PublicUser; group: GroupDetail }) {
  const [confirming, setConfirming] = useState(false)
  const { kick, onError, toast } = useMemberActions(group)
  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Remove
      </Button>
    )
  }
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={kick.isPending}
        onClick={() =>
          kick.mutate(user, {
            onSuccess: () => toast.success(`${user.displayName} was removed`),
            onError,
          })
        }
      >
        Remove {user.displayName.split(' ')[0]}
      </Button>
    </>
  )
}

function InvitePeople({ group }: { group: GroupDetail }) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim())
  const results = useUserSearch(deferred)
  const { invite, onError, toast } = useMemberActions(group)
  const memberIds = new Set(group.members.map((m) => m.id))
  const invitedIds = new Set(group.invites.map((m) => m.id))

  return (
    <Section title="Invite people" description="Search by username.">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username"
          aria-label="Search people by username"
          className={`${inputClass} pl-10`}
        />
      </div>
      {deferred && results.data && (
        <ul className="rounded-xl border border-line bg-paper px-4">
          {results.data.length === 0 && (
            <li className="py-4 text-sm text-muted">Nobody's username starts with "{deferred}".</li>
          )}
          {results.data.map((u) => (
            <PersonRow key={u.id} user={u}>
              {memberIds.has(u.id) ? (
                <span className="text-sm text-muted">Member</span>
              ) : invitedIds.has(u.id) ? (
                <span className="text-sm text-muted">Invited</span>
              ) : (
                <Button
                  size="sm"
                  loading={invite.isPending && invite.variables?.id === u.id}
                  onClick={() =>
                    invite.mutate(u, {
                      onSuccess: () => toast.success(`Invited ${u.displayName}`),
                      onError,
                    })
                  }
                >
                  Invite
                </Button>
              )}
            </PersonRow>
          ))}
        </ul>
      )}
    </Section>
  )
}

export function MembersTab({ group }: { group: GroupDetail }) {
  const me = useMe()
  const isOwner = group.myStatus === 'owner'
  const { approve, reject, revoke, onError, toast } = useMemberActions(group)

  return (
    <div className="flex flex-col gap-8">
      {isOwner && group.requests.length > 0 && (
        <Section title="Asking to join">
          <ul className="rounded-xl border border-sprout/60 bg-sprout-soft px-4">
            {group.requests.map((u) => (
              <PersonRow key={u.id} user={u}>
                <Button variant="ghost" size="sm" onClick={() => reject.mutate(u, { onError })}>
                  Decline
                </Button>
                <Button
                  size="sm"
                  loading={approve.isPending && approve.variables?.id === u.id}
                  onClick={() =>
                    approve.mutate(u, {
                      onSuccess: () => toast.success(`${u.displayName} joined`),
                      onError,
                    })
                  }
                >
                  Approve
                </Button>
              </PersonRow>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Members (${group.members.length})`}>
        <ul className="rounded-xl border border-line bg-paper px-4">
          {group.members.map((u) => (
            <PersonRow
              key={u.id}
              user={u}
              note={
                u.id === group.owner.id ? (
                  <span className="ml-1 text-xs font-semibold text-pine">Owner</span>
                ) : u.id === me.id ? (
                  <span className="ml-1 text-xs font-normal text-muted">(you)</span>
                ) : null
              }
            >
              {isOwner && u.id !== me.id && <KickButton user={u} group={group} />}
            </PersonRow>
          ))}
        </ul>
      </Section>

      {isOwner && <InvitePeople group={group} />}

      {isOwner && group.invites.length > 0 && (
        <Section title="Invited" description="Waiting for them to accept.">
          <ul className="rounded-xl border border-line bg-paper px-4">
            {group.invites.map((u) => (
              <PersonRow key={u.id} user={u}>
                <Button variant="ghost" size="sm" onClick={() => revoke.mutate(u, { onError })}>
                  Cancel invite
                </Button>
              </PersonRow>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
