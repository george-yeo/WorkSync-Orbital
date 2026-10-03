import type { Types } from 'mongoose'
import { badRequest, conflict, forbidden, notFound } from '../../lib/http-error.js'
import { processAvatar } from '../../lib/images.js'
import { sameId } from '../../lib/object-id.js'
import { prefixQuery } from '../../lib/strings.js'
import {
  ChatChannelModel,
  ChatMessageModel,
  GroupCommentModel,
  GroupModel,
  TaskModel,
  UserModel,
  groupNameKey,
  type GroupDoc,
} from '../../models/index.js'
import { realtime } from '../../realtime/notifier.js'
import { PUBLIC_USER_FIELDS, toPublicUser, type UserLike } from '../users/user.dto.js'
import { visibleGroupsFilter, type Viewer } from '../users/visibility.js'
import {
  toGroupDetail,
  toGroupSummary,
  type CommentDto,
  type GroupDetailDto,
  type GroupSummaryDto,
} from './group.dto.js'

const MAX_OWNED_GROUPS = 20
const MAX_MEMBERS = 100

// ---------------------------------------------------------------------------------------------
// Loading & access control
// ---------------------------------------------------------------------------------------------

async function loadGroup(groupId: string): Promise<GroupDoc> {
  const group = await GroupModel.findById(groupId)
  if (!group) throw notFound('Group')
  return group
}

const isMember = (g: GroupDoc, userId: string) => g.members.some((m) => sameId(m, userId))
const isOwner = (g: GroupDoc, userId: string) => sameId(g.owner, userId)

/** Members-only resources 404 for outsiders so private groups don't leak their existence. */
async function loadAsMember(groupId: string, userId: string): Promise<GroupDoc> {
  const g = await loadGroup(groupId)
  if (!isMember(g, userId)) throw notFound('Group')
  return g
}

/**
 * v1's `canManage` was an async function called without `await`, so the check always passed
 * and any logged-in user could manage any group. This is the single, synchronous gate now.
 */
async function loadAsOwner(groupId: string, userId: string): Promise<GroupDoc> {
  const g = await loadAsMember(groupId, userId)
  if (!isOwner(g, userId)) throw forbidden('Only the group owner can do that')
  return g
}

const memberIds = (g: { members: Types.ObjectId[] }) => g.members.map(String)

function notifyGroup(g: { _id: Types.ObjectId; members: Types.ObjectId[] }, extra: string[] = []) {
  realtime.toUsers([...memberIds(g), ...extra], 'groups:changed', { groupId: String(g._id) })
}

// ---------------------------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------------------------

async function summaries(filter: Record<string, unknown>, viewerId: string, limit = 50) {
  const groups = await GroupModel.find(filter)
    .populate<{ owner: UserLike }>('owner', PUBLIC_USER_FIELDS)
    .sort({ nameLower: 1 })
    .limit(limit)
    .lean()
  return groups.filter((g) => g.owner).map((g) => toGroupSummary(g, viewerId))
}

export function listMyGroups(userId: string): Promise<GroupSummaryDto[]> {
  return summaries({ $or: [{ members: userId }, { requests: userId }] }, userId)
}

export function listMyInvites(userId: string): Promise<GroupSummaryDto[]> {
  return summaries({ invites: userId }, userId)
}

export function searchGroups(q: string, viewer: Viewer): Promise<GroupSummaryDto[]> {
  return summaries({ ...visibleGroupsFilter(viewer), nameLower: prefixQuery(q) }, viewer.userId, 12)
}

async function featuredComment(groupId: Types.ObjectId): Promise<CommentDto | null> {
  // Rotate between the five most recent comments, like the v1 "sign" next to the tree.
  const recent = await GroupCommentModel.find({ group: groupId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate<{ author: UserLike | null }>('author', PUBLIC_USER_FIELDS)
    .lean()
  const withAuthor = recent.filter((c) => c.author)
  const pick = withAuthor[Math.floor(Math.random() * withAuthor.length)]
  if (!pick?.author) return null
  return {
    id: String(pick._id),
    message: pick.message,
    author: toPublicUser(pick.author),
    createdAt: pick.createdAt.toISOString(),
  }
}

export async function getGroupDetail(groupId: string, userId: string): Promise<GroupDetailDto> {
  const g = await GroupModel.findOne({ _id: groupId, members: userId })
    .populate<{ owner: UserLike }>('owner', PUBLIC_USER_FIELDS)
    .populate<{ members: UserLike[] }>('members', PUBLIC_USER_FIELDS)
    .populate<{ invites: UserLike[] }>('invites', PUBLIC_USER_FIELDS)
    .populate<{ requests: UserLike[] }>('requests', PUBLIC_USER_FIELDS)
    .lean()
  if (!g) throw notFound('Group')
  return toGroupDetail(g, userId, await featuredComment(g._id))
}

export async function listComments(groupId: string, userId: string): Promise<CommentDto[]> {
  await loadAsMember(groupId, userId)
  const comments = await GroupCommentModel.find({ group: groupId })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate<{ author: UserLike | null }>('author', PUBLIC_USER_FIELDS)
    .lean()
  return comments.flatMap((c) =>
    c.author
      ? [
          {
            id: String(c._id),
            message: c.message,
            author: toPublicUser(c.author),
            createdAt: c.createdAt.toISOString(),
          },
        ]
      : [],
  )
}

// ---------------------------------------------------------------------------------------------
// Owner actions
// ---------------------------------------------------------------------------------------------

async function assertNameAvailable(name: string, demoOwner: string | null, exceptGroupId?: string) {
  const existing = await GroupModel.findOne({ nameLower: groupNameKey(name, demoOwner) })
    .select('_id')
    .lean()
  if (existing && String(existing._id) !== exceptGroupId) throw conflict('That group name is taken')
}

export async function createGroup(viewer: Viewer, input: { name: string; isPrivate: boolean }) {
  const { userId } = viewer
  if ((await GroupModel.countDocuments({ owner: userId })) >= MAX_OWNED_GROUPS) {
    throw badRequest(`You can own at most ${MAX_OWNED_GROUPS} groups`)
  }
  const demoOwner = viewer.isGuest ? userId : null
  await assertNameAvailable(input.name, demoOwner)

  const group = await GroupModel.create({
    name: input.name,
    nameLower: groupNameKey(input.name, demoOwner),
    demoOwner,
    owner: userId,
    members: [userId],
    isPrivate: input.isPrivate,
  })
  const channel = await ChatChannelModel.create({
    type: 'group',
    group: group._id,
    participants: [userId],
  })
  group.chatChannel = channel._id
  await group.save()

  realtime.toUsers([userId], 'chats:changed')
  return getGroupDetail(String(group._id), userId)
}

export async function updateGroup(
  groupId: string,
  userId: string,
  patch: { name?: string; isPrivate?: boolean },
) {
  const g = await loadAsOwner(groupId, userId)
  if (patch.name !== undefined && patch.name !== g.name) {
    await assertNameAvailable(patch.name, g.demoOwner ? String(g.demoOwner) : null, groupId)
    g.name = patch.name
  }
  if (patch.isPrivate !== undefined) {
    g.isPrivate = patch.isPrivate
    // Going private closes the door on pending join requests.
    if (patch.isPrivate) g.requests.splice(0)
  }
  await g.save()
  notifyGroup(g)
  return getGroupDetail(groupId, userId)
}

export async function setGroupAvatar(groupId: string, userId: string, file: Buffer | undefined) {
  if (!file) throw badRequest('No image uploaded')
  const g = await loadAsOwner(groupId, userId)
  const data = await processAvatar(file)
  await GroupModel.updateOne(
    { _id: g._id },
    { $set: { avatar: { data, contentType: 'image/webp' } }, $inc: { avatarVersion: 1 } },
  )
  notifyGroup(g)
  return getGroupDetail(groupId, userId)
}

export async function getGroupAvatar(groupId: string) {
  const g = await GroupModel.findById(groupId).select('+avatar').lean()
  if (!g?.avatar?.data) throw notFound('Avatar')
  return g.avatar
}

/** Removes a group and everything hanging off it. Used by delete-group and account deletion. */
export async function deleteGroupCascade(g: {
  _id: Types.ObjectId
  members: Types.ObjectId[]
  invites: Types.ObjectId[]
  chatChannel?: Types.ObjectId | null
}) {
  await Promise.all([
    TaskModel.deleteMany({ group: g._id }),
    GroupCommentModel.deleteMany({ group: g._id }),
    g.chatChannel ? ChatMessageModel.deleteMany({ channel: g.chatChannel }) : null,
    g.chatChannel ? ChatChannelModel.deleteOne({ _id: g.chatChannel }) : null,
  ])
  await GroupModel.deleteOne({ _id: g._id })
  const affected = [...memberIds(g), ...g.invites.map(String)]
  realtime.toUsers(affected, 'groups:changed', { groupId: String(g._id) })
  realtime.toUsers(affected, 'chats:changed')
  realtime.toUsers(affected, 'tasks:changed')
  realtime.toUsers(g.invites.map(String), 'invites:changed')
}

export async function deleteGroup(groupId: string, userId: string) {
  await deleteGroupCascade(await loadAsOwner(groupId, userId))
}

export async function invite(groupId: string, ownerId: string, targetId: string) {
  const g = await loadAsOwner(groupId, ownerId)
  // Sandbox groups can only invite the fictional seed users; real groups only real users.
  const allowed = g.demoOwner ? { isSeed: true } : { isSeed: false, isGuest: false }
  if (!(await UserModel.exists({ _id: targetId, ...allowed }))) throw notFound('User')
  if (isMember(g, targetId)) throw conflict('That user is already a member')
  if (g.invites.some((u) => sameId(u, targetId)))
    throw conflict('That user has already been invited')
  if (g.members.length + g.invites.length >= MAX_MEMBERS) throw badRequest('This group is full')

  // If they had asked to join, an invite from the owner is as good as an approval.
  if (g.requests.some((u) => sameId(u, targetId))) return approveRequest(groupId, ownerId, targetId)

  await GroupModel.updateOne({ _id: g._id }, { $addToSet: { invites: targetId } })
  realtime.toUsers([targetId], 'invites:changed')
  notifyGroup(g)
  return getGroupDetail(groupId, ownerId)
}

export async function revokeInvite(groupId: string, ownerId: string, targetId: string) {
  const g = await loadAsOwner(groupId, ownerId)
  await GroupModel.updateOne({ _id: g._id }, { $pull: { invites: targetId } })
  realtime.toUsers([targetId], 'invites:changed')
  return getGroupDetail(groupId, ownerId)
}

async function addMember(g: GroupDoc, userId: string) {
  await GroupModel.updateOne(
    { _id: g._id },
    { $addToSet: { members: userId }, $pull: { invites: userId, requests: userId } },
  )
  if (g.chatChannel) {
    await ChatChannelModel.updateOne(
      { _id: g.chatChannel },
      { $addToSet: { participants: userId } },
    )
  }
  notifyGroup(g, [userId])
  realtime.toUsers([userId], 'chats:changed')
  realtime.toUsers([userId], 'invites:changed')
}

async function removeMember(g: GroupDoc, userId: string) {
  await GroupModel.updateOne({ _id: g._id }, { $pull: { members: userId } })
  await Promise.all([
    g.chatChannel
      ? ChatChannelModel.updateOne({ _id: g.chatChannel }, { $pull: { participants: userId } })
      : null,
    TaskModel.deleteMany({ group: g._id, owner: userId }),
  ])
  notifyGroup(g)
  realtime.toUsers([userId], 'chats:changed')
  realtime.toUsers([userId], 'tasks:changed')
}

export async function approveRequest(groupId: string, ownerId: string, targetId: string) {
  const g = await loadAsOwner(groupId, ownerId)
  if (!g.requests.some((u) => sameId(u, targetId))) throw notFound('Join request')
  if (g.members.length >= MAX_MEMBERS) throw badRequest('This group is full')
  await addMember(g, targetId)
  return getGroupDetail(groupId, ownerId)
}

export async function rejectRequest(groupId: string, ownerId: string, targetId: string) {
  const g = await loadAsOwner(groupId, ownerId)
  await GroupModel.updateOne({ _id: g._id }, { $pull: { requests: targetId } })
  notifyGroup(g, [targetId])
  return getGroupDetail(groupId, ownerId)
}

export async function kickMember(groupId: string, ownerId: string, targetId: string) {
  const g = await loadAsOwner(groupId, ownerId)
  if (sameId(targetId, ownerId))
    throw badRequest('The owner cannot be removed; delete the group instead')
  if (!isMember(g, targetId)) throw notFound('Member')
  await removeMember(g, targetId)
  realtime.toUsers([targetId], 'groups:changed', { groupId })
  return getGroupDetail(groupId, ownerId)
}

// ---------------------------------------------------------------------------------------------
// Member / outsider actions
// ---------------------------------------------------------------------------------------------

export async function acceptInvite(groupId: string, userId: string) {
  const g = await loadGroup(groupId)
  if (!g.invites.some((u) => sameId(u, userId))) throw notFound('Invite')
  await addMember(g, userId)
  return getGroupDetail(groupId, userId)
}

export async function declineInvite(groupId: string, userId: string) {
  const g = await loadGroup(groupId)
  await GroupModel.updateOne({ _id: g._id }, { $pull: { invites: userId } })
  realtime.toUsers([userId], 'invites:changed')
  notifyGroup(g)
}

export async function requestToJoin(groupId: string, viewer: Viewer) {
  const { userId } = viewer
  const g = await GroupModel.findOne({ _id: groupId, ...visibleGroupsFilter(viewer) })
  if (!g) throw notFound('Group')
  if (isMember(g, userId)) throw conflict('You are already a member')
  if (g.isPrivate) throw forbidden('This group is private; ask the owner for an invite')
  // An outstanding invite means they can just join.
  if (g.invites.some((u) => sameId(u, userId))) return acceptInvite(groupId, userId)
  await GroupModel.updateOne({ _id: g._id }, { $addToSet: { requests: userId } })
  realtime.toUsers([String(g.owner)], 'groups:changed', { groupId })
  return null
}

export async function cancelJoinRequest(groupId: string, userId: string) {
  const g = await loadGroup(groupId)
  await GroupModel.updateOne({ _id: g._id }, { $pull: { requests: userId } })
  realtime.toUsers([String(g.owner), userId], 'groups:changed', { groupId })
}

export async function leaveGroup(groupId: string, userId: string) {
  const g = await loadAsMember(groupId, userId)
  if (isOwner(g, userId)) throw badRequest('Owners cannot leave their own group; delete it instead')
  await removeMember(g, userId)
  realtime.toUsers([userId], 'groups:changed', { groupId })
}

export async function addComment(
  groupId: string,
  userId: string,
  message: string,
): Promise<CommentDto> {
  const g = await loadAsMember(groupId, userId)
  const comment = await GroupCommentModel.create({ group: g._id, author: userId, message })
  const author = await UserModel.findById(userId).select(PUBLIC_USER_FIELDS).lean()
  notifyGroup(g)
  return {
    id: String(comment._id),
    message: comment.message,
    author: toPublicUser(author!),
    createdAt: comment.createdAt.toISOString(),
  }
}

export async function membersForAssignment(groupId: string, ownerId: string): Promise<string[]> {
  return memberIds(await loadAsOwner(groupId, ownerId))
}

export { loadAsMember }
