// Mirrors the server DTOs (server/src/modules/**/*.dto.ts).

export interface PublicUser {
  id: string
  username: string
  displayName: string
  avatarVersion: number | null
}

export interface Me extends PublicUser {
  email: string
  isGuest: boolean
  createdAt: string
}

export interface Session {
  token: string
  user: Me
}

export interface TaskList {
  id: string
  title: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  deadline: string | null
  completedAt: string | null
  listId: string | null
  groupId: string | null
  assignedBy: string | null
  createdAt: string
  updatedAt: string
}

export type MembershipStatus = 'owner' | 'member' | 'invited' | 'requested' | 'none'

export interface Tree {
  isGrowing: boolean
  progress: number
  grown: number
}

export interface GroupSummary {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  avatarVersion: number | null
  tree: Tree
  owner: PublicUser
  myStatus: MembershipStatus
}

export interface GroupComment {
  id: string
  message: string
  author: PublicUser
  createdAt: string
}

export interface GroupDetail extends GroupSummary {
  members: PublicUser[]
  invites: PublicUser[]
  requests: PublicUser[]
  featuredComment: GroupComment | null
  chatChannelId: string | null
  createdAt: string
}

export interface Channel {
  id: string | null
  type: 'direct' | 'group'
  name: string
  avatar: { kind: 'user' | 'group'; id: string; version: number | null }
  peer: PublicUser | null
  groupId: string | null
  lastMessage: { text: string; senderId: string; at: string } | null
  lastActivityAt: string | null
  locked: { isPrivate: boolean; requested: boolean } | null
}

export interface Message {
  id: string
  channelId: string
  sender: PublicUser
  text: string
  createdAt: string
}

export interface MessagePage {
  messages: Message[]
  hasMore: boolean
}
