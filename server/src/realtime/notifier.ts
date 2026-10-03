/**
 * Thin seam between domain services and the transport. Services call `realtime.toUsers(...)`;
 * the Socket.IO layer registers itself as the implementation at boot. In tests nothing is
 * registered, so events are simply dropped.
 */
export interface ServerToClientEvents {
  'message:new': (payload: { channelId: string; message: unknown }) => void
  'chats:changed': () => void
  'groups:changed': (payload: { groupId: string }) => void
  'invites:changed': () => void
  'tasks:changed': () => void
  'presence:init': (payload: { online: string[] }) => void
  'presence:update': (payload: { userId: string; online: boolean }) => void
}

type EventName = Exclude<keyof ServerToClientEvents, `presence:${string}`>
type EventArgs<E extends EventName> = Parameters<ServerToClientEvents[E]>

export interface Notifier {
  toUsers<E extends EventName>(userIds: Iterable<string>, event: E, ...args: EventArgs<E>): void
}

let impl: Notifier | null = null

export const realtime: Notifier & { register(n: Notifier | null): void } = {
  register(n) {
    impl = n
  },
  toUsers(userIds, event, ...args) {
    impl?.toUsers(userIds, event, ...args)
  },
}
