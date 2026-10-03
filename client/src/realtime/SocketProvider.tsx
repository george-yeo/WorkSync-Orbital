import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '../auth/AuthProvider'
import { API_URL } from '../lib/api'
import type { Message, MessagePage } from '../lib/types'

interface RealtimeState {
  online: Set<string>
  unread: Set<string>
  /** The chat currently on screen; messages arriving there don't count as unread. */
  setActiveChannel: (id: string | null) => void
}

const RealtimeContext = createContext<RealtimeState | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [online, setOnline] = useState<Set<string>>(new Set())
  const [unread, setUnread] = useState<Set<string>>(new Set())
  const activeChannel = useRef<string | null>(null)
  const myId = user?.id

  const setActiveChannel = useCallback((id: string | null) => {
    activeChannel.current = id
    if (id) {
      setUnread((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  useEffect(() => {
    if (!token) return
    const socket: Socket = io(API_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('presence:init', ({ online }: { online: string[] }) => setOnline(new Set(online)))
    socket.on(
      'presence:update',
      ({ userId, online: isOnline }: { userId: string; online: boolean }) =>
        setOnline((prev) => {
          const next = new Set(prev)
          if (isOnline) next.add(userId)
          else next.delete(userId)
          return next
        }),
    )

    socket.on('message:new', ({ channelId, message }: { channelId: string; message: Message }) => {
      queryClient.setQueryData<MessagePage>(['messages', channelId], (page) => {
        if (!page || page.messages.some((m) => m.id === message.id)) return page
        return { ...page, messages: [...page.messages, message] }
      })
      if (message.sender.id !== myId && activeChannel.current !== channelId) {
        setUnread((prev) => new Set(prev).add(channelId))
      }
    })
    socket.on('chats:changed', () => void queryClient.invalidateQueries({ queryKey: ['chats'] }))
    socket.on('tasks:changed', () => void queryClient.invalidateQueries({ queryKey: ['tasks'] }))
    socket.on(
      'invites:changed',
      () => void queryClient.invalidateQueries({ queryKey: ['invites'] }),
    )
    socket.on('groups:changed', ({ groupId }: { groupId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
      void queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    })

    return () => {
      socket.close()
      setOnline(new Set())
      setUnread(new Set())
    }
  }, [token, myId, queryClient])

  const value = useMemo(
    () => ({ online, unread, setActiveChannel }),
    [online, unread, setActiveChannel],
  )
  return <RealtimeContext value={value}>{children}</RealtimeContext>
}

export function useRealtime(): RealtimeState {
  const ctx = use(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used inside <SocketProvider>')
  return ctx
}
