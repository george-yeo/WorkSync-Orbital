import { ArrowLeft, Lock, Search, SendHorizontal, UsersRound } from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMe } from '../../auth/AuthProvider'
import { Avatar } from '../../components/ui/Avatar'
import { Button, IconButton } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/Field'
import { PageSpinner, Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toaster'
import { cn } from '../../lib/cn'
import { messageTime } from '../../lib/format'
import {
  useChannelSearch,
  useChannels,
  useJoinRequest,
  useLoadOlderMessages,
  useMessages,
  useSendMessage,
} from '../../lib/queries'
import type { Channel, Message } from '../../lib/types'
import { useRealtime } from '../../realtime/SocketProvider'

const channelKey = (c: Channel) => c.id ?? `${c.type}:${c.peer?.id ?? c.groupId}`

function ChannelItem({
  channel,
  active,
  unread,
  onSelect,
}: {
  channel: Channel
  active: boolean
  unread: boolean
  onSelect: () => void
}) {
  const me = useMe()
  const { online } = useRealtime()
  const preview = channel.locked
    ? channel.locked.isPrivate
      ? 'Private group'
      : 'Public group, ask to join'
    : channel.lastMessage
      ? `${channel.lastMessage.senderId === me.id ? 'You: ' : ''}${channel.lastMessage.text}`
      : channel.id
        ? 'No messages yet'
        : 'Start a conversation'
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
          active ? 'bg-pine-soft' : 'hover:bg-sunken',
        )}
      >
        <Avatar
          kind={channel.avatar.kind}
          id={channel.avatar.id}
          name={channel.name}
          version={channel.avatar.version}
          online={channel.peer ? online.has(channel.peer.id) : undefined}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate', unread ? 'font-bold' : 'font-semibold')}>
              {channel.name}
            </span>
            {channel.lastMessage && (
              <span className="shrink-0 text-xs text-muted">
                {messageTime(channel.lastMessage.at)}
              </span>
            )}
          </span>
          <span className={cn('block truncate text-sm', unread ? 'text-ink' : 'text-muted')}>
            {preview}
          </span>
        </span>
        {unread && (
          <span className="size-2.5 shrink-0 rounded-full bg-sprout" aria-label="Unread messages" />
        )}
      </button>
    </li>
  )
}

function MessageList({ channel }: { channel: Channel }) {
  const me = useMe()
  const page = useMessages(channel.id)
  const older = useLoadOlderMessages(channel.id)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const lastId = page.data?.messages.at(-1)?.id

  // Stick to the bottom when a new message arrives (but not when older ones are prepended).
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastId])

  if (!channel.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Avatar
          id={channel.avatar.id}
          name={channel.name}
          version={channel.avatar.version}
          size="lg"
        />
        <p className="text-muted">This is the start of your conversation with {channel.name}.</p>
      </div>
    )
  }
  if (page.isPending)
    return (
      <div className="flex-1">
        <PageSpinner />
      </div>
    )
  if (page.isError) return <p className="flex-1 p-6 text-ember">{page.error.message}</p>

  const messages = page.data.messages
  return (
    <div
      ref={scroller}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {page.data.hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          loading={older.isPending}
          onClick={() => messages[0] && older.mutate(messages[0].createdAt)}
        >
          Load earlier messages
        </Button>
      )}
      {messages.length === 0 && <p className="m-auto text-muted">No messages yet. Say hello.</p>}
      <ol className="mt-auto flex flex-col gap-0.5">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={m.sender.id === me.id}
            showSender={channel.type === 'group'}
            prev={messages[i - 1]}
          />
        ))}
      </ol>
      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({
  message,
  mine,
  showSender,
  prev,
}: {
  message: Message
  mine: boolean
  showSender: boolean
  prev?: Message
}) {
  const grouped =
    prev &&
    prev.sender.id === message.sender.id &&
    new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000
  return (
    <li
      className={cn(
        'flex items-end gap-2',
        mine ? 'flex-row-reverse' : 'flex-row',
        !grouped && 'mt-3',
      )}
    >
      {!mine && (
        <span className="w-8 shrink-0">
          {!grouped && (
            <Avatar
              id={message.sender.id}
              name={message.sender.displayName}
              version={message.sender.avatarVersion}
              size="sm"
            />
          )}
        </span>
      )}
      <div className={cn('flex max-w-[75%] flex-col', mine ? 'items-end' : 'items-start')}>
        {!grouped && (
          <span className="mb-1 px-1 text-xs text-muted">
            {!mine && showSender && (
              <span className="font-semibold text-ink">{message.sender.displayName} </span>
            )}
            {messageTime(message.createdAt)}
          </span>
        )}
        <p
          className={cn(
            'rounded-2xl px-3.5 py-2 break-words whitespace-pre-wrap',
            mine
              ? 'rounded-br-md bg-pine text-pine-ink'
              : 'rounded-bl-md border border-line bg-paper',
          )}
        >
          {message.text}
        </p>
      </div>
    </li>
  )
}

function Composer({ channel, onSent }: { channel: Channel; onSent: (c: Channel) => void }) {
  const send = useSendMessage()
  const toast = useToast()
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => ref.current?.focus(), [channel])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const value = text.trim()
    if (!value || send.isPending) return
    setText('')
    send.mutate(
      { channel, text: value },
      {
        onSuccess: (res) => onSent(res.channel),
        onError: (err) => {
          setText(value)
          toast.error(err.message)
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-line bg-paper p-3">
      <label htmlFor="composer" className="sr-only">
        Message {channel.name}
      </label>
      <textarea
        id="composer"
        ref={ref}
        value={text}
        rows={1}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={`Message ${channel.name}`}
        className={cn(inputClass, 'max-h-40 resize-none [field-sizing:content]')}
      />
      <IconButton
        label="Send"
        type="submit"
        disabled={!text.trim() || send.isPending}
        className="size-10.5 bg-pine text-pine-ink hover:bg-pine hover:text-pine-ink hover:brightness-110"
      >
        {send.isPending ? <Spinner className="size-4" /> : <SendHorizontal className="size-4.5" />}
      </IconButton>
    </form>
  )
}

function LockedGroup({ channel }: { channel: Channel }) {
  const join = useJoinRequest()
  const toast = useToast()
  const [requested, setRequested] = useState(channel.locked?.requested ?? false)
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <Lock className="size-6 text-muted" />
      <p className="max-w-xs text-muted">
        {channel.locked?.isPrivate
          ? 'This group is invite only. Ask the owner for an invitation to read its chat.'
          : 'Join this group to read and send messages.'}
      </p>
      {!channel.locked?.isPrivate &&
        (requested ? (
          <p className="text-sm font-semibold text-pine">Request sent</p>
        ) : (
          <Button
            loading={join.isPending}
            onClick={() =>
              join.mutate(
                { groupId: channel.groupId! },
                { onSuccess: () => setRequested(true), onError: (e) => toast.error(e.message) },
              )
            }
          >
            Ask to join
          </Button>
        ))}
    </div>
  )
}

function Conversation({
  channel,
  onBack,
  onSent,
}: {
  channel: Channel
  onBack: () => void
  onSent: (c: Channel) => void
}) {
  const { online } = useRealtime()
  const status = channel.peer ? (online.has(channel.peer.id) ? 'Online' : 'Offline') : 'Group chat'
  return (
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label={`Conversation with ${channel.name}`}
    >
      <header className="flex items-center gap-3 border-b border-line bg-paper px-3 py-2.5 sm:px-4">
        <IconButton label="Back to chats" onClick={onBack} className="md:hidden">
          <ArrowLeft className="size-5" />
        </IconButton>
        <Avatar
          kind={channel.avatar.kind}
          id={channel.avatar.id}
          name={channel.name}
          version={channel.avatar.version}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-sans text-base font-semibold tracking-normal">
            {channel.name}
          </h2>
          <p className="text-xs text-muted">{status}</p>
        </div>
        {channel.groupId && !channel.locked && (
          <Link
            to={`/groups/${channel.groupId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
          >
            <UsersRound className="size-4" /> View group
          </Link>
        )}
      </header>
      {channel.locked ? (
        <LockedGroup channel={channel} />
      ) : (
        <>
          <MessageList channel={channel} />
          <Composer channel={channel} onSent={onSent} />
        </>
      )}
    </section>
  )
}

export function ChatPage() {
  const channels = useChannels()
  const { unread, setActiveChannel } = useRealtime()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim())
  const search = useChannelSearch(deferred)
  // A channel picked from search that doesn't exist yet (new DM / locked group).
  const [draft, setDraft] = useState<Channel | null>(null)

  const selectedId = params.get('c')
  const fromList = selectedId ? channels.data?.find((c) => c.id === selectedId) : undefined
  // Fall back to the channel the person just picked while the list refetches.
  const selected: Channel | null =
    fromList ??
    (draft && (selectedId ? draft.id === selectedId : !draft.id || Boolean(draft.locked))
      ? draft
      : null)

  useEffect(() => {
    setActiveChannel(selected?.id ?? null)
    return () => setActiveChannel(null)
  }, [selected?.id, setActiveChannel])

  const select = (c: Channel) => {
    setDraft(c)
    setParams(c.id && !c.locked ? { c: c.id } : {})
    setQuery('')
  }

  const list = deferred ? search.data : channels.data
  const showConversation = Boolean(selected)

  return (
    <div className="flex h-full">
      <aside
        className={cn(
          'flex w-full flex-col border-r border-line bg-paper md:w-80 md:shrink-0',
          showConversation && 'hidden md:flex',
        )}
        aria-label="Chats"
      >
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <h1 className="text-xl font-bold">Chat</h1>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find people or groups"
              aria-label="Find people or groups"
              className={cn(inputClass, 'py-1.5 pl-9 text-sm')}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {(deferred ? search.isPending : channels.isPending) ? (
            <PageSpinner />
          ) : list?.length ? (
            <ul className="flex flex-col gap-0.5">
              {list.map((c) => (
                <ChannelItem
                  key={channelKey(c)}
                  channel={c}
                  active={selected ? channelKey(selected) === channelKey(c) : false}
                  unread={Boolean(c.id && unread.has(c.id))}
                  onSelect={() => select(c)}
                />
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted">
              {deferred
                ? `Nobody or no group starts with "${deferred}".`
                : 'No conversations yet. Search for someone to message.'}
            </p>
          )}
        </div>
      </aside>

      {selected ? (
        <Conversation
          key={channelKey(selected)}
          channel={selected}
          onBack={() => {
            setDraft(null)
            setParams({})
          }}
          onSent={(c) => c.id && c.id !== selected.id && select(c)}
        />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-2 p-6 text-center md:flex">
          <p className="font-display text-xl font-semibold">Pick a conversation</p>
          <p className="max-w-xs text-muted">
            Choose a chat on the left, or search for a person or group to start one.
          </p>
        </div>
      )}
    </div>
  )
}
