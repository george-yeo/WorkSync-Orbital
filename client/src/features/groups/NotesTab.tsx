import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { inputClass } from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toaster'
import { api } from '../../lib/api'
import { relative } from '../../lib/format'
import { useGroupAction, useGroupComments } from '../../lib/queries'
import type { GroupComment, GroupDetail } from '../../lib/types'

export function NotesTab({ group }: { group: GroupDetail }) {
  const comments = useGroupComments(group.id)
  const qc = useQueryClient()
  const toast = useToast()
  const [text, setText] = useState('')
  const add = useGroupAction(group.id, (message: string) =>
    api.post<GroupComment>(`/groups/${group.id}/comments`, { message }).then(() => undefined),
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    add.mutate(text.trim(), {
      onSuccess: () => {
        setText('')
        void qc.invalidateQueries({ queryKey: ['group', group.id, 'comments'] })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm font-semibold">
          Leave a note for the group
        </label>
        <p className="text-xs text-muted">
          Recent notes take turns appearing next to the SyncTree.
        </p>
        <div className="flex gap-2">
          <input
            id="note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            placeholder="Great work this week, everyone"
            className={inputClass}
          />
          <Button type="submit" loading={add.isPending} disabled={!text.trim()}>
            Post
          </Button>
        </div>
      </form>

      {comments.isPending ? (
        <PageSpinner />
      ) : comments.data?.length ? (
        <ul className="rounded-xl border border-line bg-paper px-4">
          {comments.data.map((c) => (
            <li key={c.id} className="flex gap-3 border-b border-line py-3.5 last:border-b-0">
              <Avatar
                id={c.author.id}
                name={c.author.displayName}
                version={c.author.avatarVersion}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{c.author.displayName}</span>{' '}
                  <span className="text-muted">{relative(c.createdAt)}</span>
                </p>
                <p className="mt-0.5 break-words">{c.message}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No notes yet">
          Encouragement, reminders, links: anything the group should see.
        </EmptyState>
      )}
    </div>
  )
}
