import type { Types } from 'mongoose'
import { badRequest, notFound } from '../../lib/http-error.js'
import { prefixQuery } from '../../lib/strings.js'
import {
  ChatChannelModel,
  ChatMessageModel,
  GroupModel,
  UserModel,
  directKeyFor,
  type ChatChannel,
} from '../../models/index.js'
import { realtime } from '../../realtime/notifier.js'
import {
  PUBLIC_USER_FIELDS,
  toPublicUser,
  type PublicUserDto,
  type UserLike,
} from '../users/user.dto.js'
import { visibleGroupsFilter, visibleUsersFilter, type Viewer } from '../users/visibility.js'

export interface ChannelDto {
  /** null for a direct conversation that hasn't been started yet, or a group you can't access. */
  id: string | null
  type: 'direct' | 'group'
  name: string
  avatar: { kind: 'user' | 'group'; id: string; version: number | null }
  peer: PublicUserDto | null
  groupId: string | null
  lastMessage: { text: string; senderId: string; at: string } | null
  lastActivityAt: string | null
  /** Present when the viewer is not a member of this group channel. */
  locked: { isPrivate: boolean; requested: boolean } | null
}

export interface MessageDto {
  id: string
  channelId: string
  sender: PublicUserDto
  text: string
  createdAt: string
}

type ChannelShape = ChatChannel & { _id: Types.ObjectId }

// ---------------------------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------------------------

async function toChannelDtos(channels: ChannelShape[], viewerId: string): Promise<ChannelDto[]> {
  const peerIds = channels
    .filter((c) => c.type === 'direct')
    .map((c) => c.participants.find((p) => String(p) !== viewerId))
    .filter(Boolean)
  const groupIds = channels.filter((c) => c.group).map((c) => c.group)

  const [users, groups] = await Promise.all([
    UserModel.find({ _id: { $in: peerIds } })
      .select(PUBLIC_USER_FIELDS)
      .lean(),
    GroupModel.find({ _id: { $in: groupIds } })
      .select('name avatarVersion')
      .lean(),
  ])
  const userById = new Map(users.map((u) => [String(u._id), u]))
  const groupById = new Map(groups.map((g) => [String(g._id), g]))

  return channels.flatMap((c): ChannelDto[] => {
    const lastMessage = c.lastMessage?.text
      ? {
          text: c.lastMessage.text,
          senderId: String(c.lastMessage.sender),
          at: c.lastMessage.at!.toISOString(),
        }
      : null
    const base = {
      id: String(c._id),
      lastMessage,
      lastActivityAt: c.lastActivityAt?.toISOString() ?? null,
      locked: null,
    }
    if (c.type === 'direct') {
      const peerId = c.participants.find((p) => String(p) !== viewerId)
      const peer = peerId && userById.get(String(peerId))
      if (!peer) return [] // the other account was deleted
      return [
        {
          ...base,
          type: 'direct',
          name: peer.displayName || peer.username,
          avatar: { kind: 'user', id: String(peer._id), version: peer.avatarVersion ?? null },
          peer: toPublicUser(peer),
          groupId: null,
        },
      ]
    }
    const group = c.group && groupById.get(String(c.group))
    if (!group) return []
    return [
      {
        ...base,
        type: 'group',
        name: group.name,
        avatar: { kind: 'group', id: String(group._id), version: group.avatarVersion ?? null },
        peer: null,
        groupId: String(group._id),
      },
    ]
  })
}

function toMessageDto(
  m: { _id: Types.ObjectId; channel: Types.ObjectId; text: string; createdAt: Date },
  sender: UserLike,
): MessageDto {
  return {
    id: String(m._id),
    channelId: String(m.channel),
    sender: toPublicUser(sender),
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------------------------

export async function recentChannels(userId: string): Promise<ChannelDto[]> {
  const channels = await ChatChannelModel.find({ participants: userId })
    .sort({ lastActivityAt: -1 })
    .limit(40)
    .lean()
  return toChannelDtos(channels, userId)
}

export async function searchChannels(q: string, viewer: Viewer): Promise<ChannelDto[]> {
  const { userId } = viewer
  const [users, groups] = await Promise.all([
    UserModel.find({
      ...visibleUsersFilter(viewer),
      usernameLower: prefixQuery(q),
      _id: { $ne: userId },
    })
      .select(PUBLIC_USER_FIELDS)
      .limit(8)
      .lean(),
    GroupModel.find({ ...visibleGroupsFilter(viewer), nameLower: prefixQuery(q) })
      .select('name avatarVersion members requests isPrivate chatChannel')
      .limit(8)
      .lean(),
  ])

  const directKeys = users.map((u) => directKeyFor(userId, String(u._id)))
  const existingDirect = await ChatChannelModel.find({ directKey: { $in: directKeys } }).lean()
  const memberGroupChannelIds = groups
    .filter((g) => g.members.some((m) => String(m) === userId) && g.chatChannel)
    .map((g) => g.chatChannel)
  const memberGroupChannels = await ChatChannelModel.find({
    _id: { $in: memberGroupChannelIds },
  }).lean()

  const known = await toChannelDtos([...existingDirect, ...memberGroupChannels], userId)
  const knownPeers = new Set(known.filter((c) => c.peer).map((c) => c.peer!.id))
  const knownGroups = new Set(known.filter((c) => c.groupId).map((c) => c.groupId!))

  const newDirect: ChannelDto[] = users
    .filter((u) => !knownPeers.has(String(u._id)))
    .map((u) => ({
      id: null,
      type: 'direct',
      name: u.displayName || u.username,
      avatar: { kind: 'user', id: String(u._id), version: u.avatarVersion ?? null },
      peer: toPublicUser(u),
      groupId: null,
      lastMessage: null,
      lastActivityAt: null,
      locked: null,
    }))
  const lockedGroups: ChannelDto[] = groups
    .filter((g) => !knownGroups.has(String(g._id)))
    .map((g) => ({
      id: null,
      type: 'group',
      name: g.name,
      avatar: { kind: 'group', id: String(g._id), version: g.avatarVersion ?? null },
      peer: null,
      groupId: String(g._id),
      lastMessage: null,
      lastActivityAt: null,
      locked: { isPrivate: g.isPrivate, requested: g.requests.some((r) => String(r) === userId) },
    }))

  return [...known, ...newDirect, ...lockedGroups]
}

async function loadParticipantChannel(channelId: string, userId: string) {
  const channel = await ChatChannelModel.findOne({ _id: channelId, participants: userId })
  if (!channel) throw notFound('Chat')
  return channel
}

export async function listMessages(
  channelId: string,
  userId: string,
  opts: { before?: Date; limit: number },
): Promise<{ messages: MessageDto[]; hasMore: boolean }> {
  await loadParticipantChannel(channelId, userId)
  const docs = await ChatMessageModel.find({
    channel: channelId,
    ...(opts.before ? { createdAt: { $lt: opts.before } } : {}),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(opts.limit + 1)
    .populate<{ sender: UserLike | null }>('sender', PUBLIC_USER_FIELDS)
    .lean()

  const hasMore = docs.length > opts.limit
  const page = docs.slice(0, opts.limit).reverse()
  const messages = page.flatMap((m) => (m.sender ? [toMessageDto(m, m.sender)] : []))
  return { messages, hasMore }
}

// ---------------------------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------------------------

async function deliver(
  channel: { _id: Types.ObjectId; participants: Types.ObjectId[] },
  senderId: string,
  text: string,
) {
  const message = await ChatMessageModel.create({ channel: channel._id, sender: senderId, text })
  await ChatChannelModel.updateOne(
    { _id: channel._id },
    {
      $set: {
        lastMessage: { text: text.slice(0, 140), sender: senderId, at: message.createdAt },
        lastActivityAt: message.createdAt,
      },
    },
  )
  const sender = await UserModel.findById(senderId).select(PUBLIC_USER_FIELDS).lean()
  const dto = toMessageDto(message, sender!)
  const recipients = channel.participants.map(String)
  realtime.toUsers(recipients, 'message:new', { channelId: String(channel._id), message: dto })
  realtime.toUsers(recipients, 'chats:changed')
  return dto
}

export async function sendMessage(
  channelId: string,
  userId: string,
  text: string,
): Promise<MessageDto> {
  const channel = await loadParticipantChannel(channelId, userId)
  return deliver(channel, userId, text)
}

/** Sends a DM, creating the conversation on first message. */
export async function sendDirectMessage(peerId: string, viewer: Viewer, text: string) {
  const { userId } = viewer
  if (peerId === userId) throw badRequest("You can't message yourself")
  if (!(await UserModel.exists({ _id: peerId, ...visibleUsersFilter(viewer) })))
    throw notFound('User')

  const channel = await ChatChannelModel.findOneAndUpdate(
    { directKey: directKeyFor(userId, peerId) },
    {
      $setOnInsert: { type: 'direct', participants: [userId, peerId], lastActivityAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' },
  )
  const message = await deliver(channel, userId, text)
  const [dto] = await toChannelDtos([channel.toObject()], userId)
  return { channel: dto!, message }
}
