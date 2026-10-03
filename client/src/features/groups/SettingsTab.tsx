import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toaster'
import { api, fieldErrorsOf } from '../../lib/api'
import { useGroupAction } from '../../lib/queries'
import type { GroupDetail } from '../../lib/types'
import { ImagePicker } from '../profile/ImagePicker'

function Row({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-5 last:border-b-0 sm:flex-row sm:items-start sm:gap-8">
      <div className="sm:w-56 sm:shrink-0">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function SettingsTab({ group }: { group: GroupDetail }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const base = `/groups/${group.id}`

  const update = useGroupAction(group.id, (patch: { name?: string; isPrivate?: boolean }) =>
    api.patch<GroupDetail>(base, patch),
  )
  const upload = useGroupAction(group.id, (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.put<GroupDetail>(`${base}/avatar`, form)
  })
  const remove = useGroupAction(group.id, () => api.delete<void>(base), [['tasks'], ['chats']])

  const onRename = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = String(new FormData(e.currentTarget).get('name'))
    if (name === group.name) return
    update.mutate({ name }, { onSuccess: () => toast.success('Group renamed') })
  }

  return (
    <div className="rounded-xl border border-line bg-paper px-5">
      <Row title="Name">
        <form onSubmit={onRename} className="flex flex-wrap items-end gap-2">
          <Field
            label="Group name"
            name="name"
            defaultValue={group.name}
            required
            minLength={3}
            maxLength={30}
            className="min-w-56 flex-1"
            error={
              fieldErrorsOf(update.error).name ??
              (update.variables?.name ? update.error?.message : undefined)
            }
          />
          <Button
            type="submit"
            variant="secondary"
            loading={update.isPending && update.variables?.name !== undefined}
          >
            Rename
          </Button>
        </form>
      </Row>

      <Row title="Picture" description="Shown in group lists and the chat.">
        <ImagePicker
          kind="group"
          id={group.id}
          name={group.name}
          version={group.avatarVersion}
          busy={upload.isPending}
          onPick={(file) =>
            upload.mutate(file, {
              onSuccess: () => toast.success('Picture updated'),
              onError: (e) => toast.error(e.message),
            })
          }
        />
      </Row>

      <Row
        title="Who can join"
        description={
          group.isPrivate ? 'Only people you invite.' : 'Anyone can find the group and ask to join.'
        }
      >
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            checked={!group.isPrivate}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate(
                { isPrivate: !e.target.checked },
                {
                  onSuccess: (g) =>
                    toast.success(
                      g?.isPrivate ? 'Group is now invite only' : 'Group is now public',
                    ),
                },
              )
            }
            className="size-5"
          />
          <span>Let people find this group and ask to join</span>
        </label>
        {group.isPrivate === false && group.requests.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            Making the group private will decline pending requests.
          </p>
        )}
      </Row>

      <Row
        title="Delete group"
        description="Removes the group, its chat, notes and everyone's group tasks."
      >
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete group
        </Button>
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={`Delete ${group.name}?`}
          description="This can't be undone. Members will lose the chat history, notes and their tasks in this group."
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(undefined, {
                  onSuccess: () => {
                    toast.success(`${group.name} was deleted`)
                    navigate('/groups')
                  },
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Delete group
            </Button>
          </div>
        </Dialog>
      </Row>
    </div>
  )
}
