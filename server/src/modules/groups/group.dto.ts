import type { Types } from 'mongoose'
import { toPublicUser, type PublicUserDto, type UserLike } from '../users/user.dto.js'

export type MembershipStatus = 'owner' | 'member' | 'invited' | 'requested' | 'none'

export interface TreeDto {
  isGrowing: boolean
  progress: number
  grown: number
}

export interface GroupSummaryDto {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  avatarVersion: number | null
  tree: TreeDto
  owner: PublicUserDto
  myStatus: MembershipStatus
}

export interface CommentDto {
  id: string
  message: string
  author: PublicUserDto
  createdAt: string
}

export interface GroupDetailDto extends GroupSummaryDto {
  members: PublicUserDto[]
  /** Only populated for the owner. */
  invites: PublicUserDto[]
  /** Only populated for the owner. */
  requests: PublicUserDto[]
  featuredComment: CommentDto | null
  chatChannelId: string | null
  createdAt: string
}

type IdLike = Types.ObjectId | UserLike

interface GroupShape {
  _id: Types.ObjectId
  name: string
  isPrivate: boolean
  owner: IdLike
  members: IdLike[]
  invites: IdLike[]
  requests: IdLike[]
  avatarVersion?: number | null
  tree?: { isGrowing?: boolean; progress?: number; grown?: number } | null
  chatChannel?: Types.ObjectId | null
  createdAt: Date
}

const idOf = (v: IdLike) => String('_id' in v ? v._id : v)

export function statusFor(g: GroupShape, userId: string): MembershipStatus {
  if (idOf(g.owner) === userId) return 'owner'
  if (g.members.some((m) => idOf(m) === userId)) return 'member'
  if (g.invites.some((m) => idOf(m) === userId)) return 'invited'
  if (g.requests.some((m) => idOf(m) === userId)) return 'requested'
  return 'none'
}

export function toGroupSummary(
  g: GroupShape & { owner: UserLike },
  viewerId: string,
): GroupSummaryDto {
  return {
    id: String(g._id),
    name: g.name,
    isPrivate: g.isPrivate,
    memberCount: g.members.length,
    avatarVersion: g.avatarVersion ?? null,
    tree: {
      isGrowing: Boolean(g.tree?.isGrowing),
      progress: g.tree?.progress ?? 0,
      grown: g.tree?.grown ?? 0,
    },
    owner: toPublicUser(g.owner),
    myStatus: statusFor(g, viewerId),
  }
}

export function toGroupDetail(
  g: GroupShape & {
    owner: UserLike
    members: UserLike[]
    invites: UserLike[]
    requests: UserLike[]
  },
  viewerId: string,
  featuredComment: CommentDto | null,
): GroupDetailDto {
  const summary = toGroupSummary(g, viewerId)
  const isOwner = summary.myStatus === 'owner'
  const ownerId = idOf(g.owner)
  // Owner first, then members alphabetically.
  const members = [...g.members].sort((a, b) =>
    String(a._id) === ownerId
      ? -1
      : String(b._id) === ownerId
        ? 1
        : a.username.localeCompare(b.username),
  )
  return {
    ...summary,
    members: members.map(toPublicUser),
    invites: isOwner ? g.invites.map(toPublicUser) : [],
    requests: isOwner ? g.requests.map(toPublicUser) : [],
    featuredComment,
    chatChannelId: g.chatChannel ? String(g.chatChannel) : null,
    createdAt: g.createdAt.toISOString(),
  }
}
