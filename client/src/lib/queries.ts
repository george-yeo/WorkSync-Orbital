import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from './api'
import type {
  Channel,
  GroupComment,
  GroupDetail,
  GroupSummary,
  Me,
  Message,
  MessagePage,
  PublicUser,
  Task,
  TaskList,
} from './types'

// ---------------------------------------------------------------------------------------------
// Tasks & lists
// ---------------------------------------------------------------------------------------------

export const useLists = () =>
  useQuery({ queryKey: ['lists'], queryFn: () => api.get<TaskList[]>('/lists') })
export const useTasks = () =>
  useQuery({ queryKey: ['tasks'], queryFn: () => api.get<Task[]>('/tasks') })

export function useCreateList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.post<TaskList>('/lists', { title }),
    onSuccess: (list) => qc.setQueryData<TaskList[]>(['lists'], (old = []) => [...old, list]),
  })
}

export function useRenameList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.patch<TaskList>(`/lists/${id}`, { title }),
    onSuccess: (list) =>
      qc.setQueryData<TaskList[]>(['lists'], (old = []) =>
        old.map((l) => (l.id === list.id ? list : l)),
      ),
  })
}

export function useDeleteList() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/lists/${id}`),
    onSuccess: (_r, id) => {
      qc.setQueryData<TaskList[]>(['lists'], (old = []) => old.filter((l) => l.id !== id))
      qc.setQueryData<Task[]>(['tasks'], (old = []) => old.filter((t) => t.listId !== id))
    },
  })
}

export interface TaskInput {
  title: string
  description?: string
  deadline?: string | null
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInput & { listId?: string; groupId?: string }) =>
      api.post<Task>('/tasks', { ...input }),
    onSuccess: (task) => qc.setQueryData<Task[]>(['tasks'], (old = []) => [...old, task]),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<TaskInput> & { id: string; completed?: boolean }) =>
      api.patch<Task>(`/tasks/${id}`, patch),
    // Optimistic completion toggle so ticking a box feels instant.
    onMutate: async ({ id, completed }) => {
      if (completed === undefined) return
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const previous = qc.getQueryData<Task[]>(['tasks'])
      qc.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map((t) =>
          t.id === id ? { ...t, completedAt: completed ? new Date().toISOString() : null } : t,
        ),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(['tasks'], ctx.previous),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(['tasks'], (old = []) =>
        old.map((t) => (t.id === task.id ? task : t)),
      )
      if (task.groupId) void qc.invalidateQueries({ queryKey: ['group', task.groupId] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: (_r, id) =>
      qc.setQueryData<Task[]>(['tasks'], (old = []) => old.filter((t) => t.id !== id)),
  })
}

// ---------------------------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------------------------

export const useGroups = () =>
  useQuery({ queryKey: ['groups'], queryFn: () => api.get<GroupSummary[]>('/groups') })
export const useInvites = () =>
  useQuery({ queryKey: ['invites'], queryFn: () => api.get<GroupSummary[]>('/groups/invites') })
export const useGroup = (id: string) =>
  useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get<GroupDetail>(`/groups/${id}`),
    retry: false,
  })
export const useGroupComments = (id: string) =>
  useQuery({
    queryKey: ['group', id, 'comments'],
    queryFn: () => api.get<GroupComment[]>(`/groups/${id}/comments`),
  })

export const useGroupSearch = (q: string) =>
  useQuery({
    queryKey: ['groups', 'search', q],
    queryFn: () => api.get<GroupSummary[]>(`/groups/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  })

export const useUserSearch = (q: string) =>
  useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => api.get<PublicUser[]>(`/users/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  })

function refreshGroup(qc: QueryClient, detail: GroupDetail | undefined | void, id: string) {
  if (detail) qc.setQueryData(['group', id], detail)
  else void qc.invalidateQueries({ queryKey: ['group', id] })
  void qc.invalidateQueries({ queryKey: ['groups'] })
}

/** Generic group mutation: runs `fn`, then refreshes the group, group lists and anything else named. */
export function useGroupAction<A>(
  groupId: string,
  fn: (arg: A) => Promise<GroupDetail | void>,
  alsoInvalidate: string[][] = [],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (detail) => {
      refreshGroup(qc, detail, groupId)
      for (const key of alsoInvalidate) void qc.invalidateQueries({ queryKey: key })
    },
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; isPrivate: boolean }) =>
      api.post<GroupDetail>('/groups', input),
    onSuccess: (g) => {
      qc.setQueryData(['group', g.id], g)
      void qc.invalidateQueries({ queryKey: ['groups'] })
      void qc.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useRespondToInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, accept }: { groupId: string; accept: boolean }) =>
      api.post<GroupDetail | undefined>(
        `/groups/${groupId}/invites/${accept ? 'accept' : 'decline'}`,
      ),
    onSuccess: () => {
      for (const key of [['invites'], ['groups'], ['chats'], ['tasks']])
        void qc.invalidateQueries({ queryKey: key })
    },
  })
}

export function useJoinRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, cancel }: { groupId: string; cancel?: boolean }) =>
      cancel ? api.delete(`/groups/${groupId}/requests`) : api.post(`/groups/${groupId}/requests`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

// ---------------------------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------------------------

export const useChannels = () =>
  useQuery({ queryKey: ['chats'], queryFn: () => api.get<Channel[]>('/chats') })

export const useChannelSearch = (q: string) =>
  useQuery({
    queryKey: ['chats', 'search', q],
    queryFn: () => api.get<Channel[]>(`/chats/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  })

export const useMessages = (channelId: string | null) =>
  useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => api.get<MessagePage>(`/chats/${channelId}/messages?limit=40`),
    enabled: Boolean(channelId),
    staleTime: Infinity, // kept fresh by the socket
  })

export function useLoadOlderMessages(channelId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (before: string) =>
      api.get<MessagePage>(
        `/chats/${channelId}/messages?limit=40&before=${encodeURIComponent(before)}`,
      ),
    onSuccess: (older) =>
      qc.setQueryData<MessagePage>(['messages', channelId], (page) =>
        page ? { messages: [...older.messages, ...page.messages], hasMore: older.hasMore } : older,
      ),
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { channel: Channel; text: string }) =>
      input.channel.id
        ? api
            .post<Message>(`/chats/${input.channel.id}/messages`, { text: input.text })
            .then((message) => ({ message, channel: input.channel }))
        : api.post<{ message: Message; channel: Channel }>(
            `/chats/direct/${input.channel.peer!.id}/messages`,
            { text: input.text },
          ),
    onSuccess: ({ message, channel }) => {
      qc.setQueryData<MessagePage>(['messages', message.channelId], (page) => {
        if (!page) return { messages: [message], hasMore: false }
        if (page.messages.some((m) => m.id === message.id)) return page
        return { ...page, messages: [...page.messages, message] }
      })
      void qc.invalidateQueries({ queryKey: ['chats'] })
      return channel
    },
  })
}

// ---------------------------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------------------------

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: { username?: string; displayName?: string; email?: string }) =>
      api.patch<Me>('/me', patch),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  })
}

export function useAvatarUpload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File | null) => {
      if (!file) return api.delete<Me>('/me/avatar')
      const form = new FormData()
      form.append('avatar', file)
      return api.put<Me>('/me/avatar', form)
    },
    onSuccess: (me) => qc.setQueryData(['me'], me),
  })
}
