import type { Types } from 'mongoose'
import {
  ChatChannelModel,
  ChatMessageModel,
  GroupCommentModel,
  GroupModel,
  TaskListModel,
  TaskModel,
  UserModel,
} from '../../models/index.js'
import { realtime } from '../../realtime/notifier.js'
import { deleteGroupCascade } from '../groups/groups.service.js'

/** Recompute `lastMessage` after messages were removed from a channel. */
async function refreshLastMessage(channelId: Types.ObjectId) {
  const last = await ChatMessageModel.findOne({ channel: channelId }).sort({ createdAt: -1 }).lean()
  await ChatChannelModel.updateOne(
    { _id: channelId },
    {
      $set: {
        lastMessage: last
          ? { text: last.text.slice(0, 140), sender: last.sender, at: last.createdAt }
          : null,
      },
    },
  )
}

/**
 * Permanently delete a user and everything they own. Used for "delete my account" and for
 * expiring demo guests. Order matters: owned groups first (they cascade their own data).
 */
export async function deleteUserCascade(userId: string): Promise<void> {
  const owned = await GroupModel.find({ $or: [{ owner: userId }, { demoOwner: userId }] })
  for (const g of owned) await deleteGroupCascade(g)

  const joined = await GroupModel.find({
    $or: [{ members: userId }, { invites: userId }, { requests: userId }],
  })
    .select('members')
    .lean()
  await GroupModel.updateMany(
    { _id: { $in: joined.map((g) => g._id) } },
    { $pull: { members: userId, invites: userId, requests: userId } },
  )
  await ChatChannelModel.updateMany(
    { type: 'group', participants: userId },
    { $pull: { participants: userId } },
  )

  const directChannels = await ChatChannelModel.find({
    type: 'direct',
    participants: userId,
  }).lean()
  const directIds = directChannels.map((c) => c._id)
  await ChatMessageModel.deleteMany({ channel: { $in: directIds } })
  await ChatChannelModel.deleteMany({ _id: { $in: directIds } })

  const groupChannelsTouched: Types.ObjectId[] = await ChatMessageModel.distinct('channel', {
    sender: userId,
  })
  await ChatMessageModel.deleteMany({ sender: userId })
  await Promise.all(groupChannelsTouched.map(refreshLastMessage))

  await Promise.all([
    GroupCommentModel.deleteMany({ author: userId }),
    TaskModel.deleteMany({ owner: userId }),
    TaskListModel.deleteMany({ owner: userId }),
  ])
  await UserModel.deleteOne({ _id: userId })

  for (const g of joined) {
    realtime.toUsers(g.members.map(String), 'groups:changed', { groupId: String(g._id) })
  }
  const peers = directChannels
    .flatMap((c) => c.participants.map(String))
    .filter((id) => id !== userId)
  realtime.toUsers(peers, 'chats:changed')
}
