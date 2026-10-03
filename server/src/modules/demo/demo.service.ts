import { randomBytes } from 'node:crypto'
import type { Types } from 'mongoose'
import { signToken } from '../../lib/jwt.js'
import { logger } from '../../lib/logger.js'
import {
  ChatChannelModel,
  ChatMessageModel,
  GroupCommentModel,
  GroupModel,
  TaskListModel,
  TaskModel,
  UserModel,
  directKeyFor,
  groupNameKey,
} from '../../models/index.js'
import type { Session } from '../auth/auth.service.js'
import { deleteUserCascade } from '../users/account.service.js'
import { toPrivateUser } from '../users/user.dto.js'
import {
  GUEST_DM,
  GUEST_GROUP_TASKS,
  GUEST_LISTS,
  SEED_GROUPS,
  SEED_USERS,
  type Actor,
} from './seed-data.js'

const GUEST_TTL_MS = 24 * 60 * 60 * 1000
/** Not a valid scrypt hash, so password login is impossible for seed and guest accounts. */
const NO_PASSWORD = 'disabled'
const EMAIL_DOMAIN = 'demo.worksync.invalid'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)
const endOfDayIn = (days: number) => {
  const d = new Date()
  d.setHours(23, 59, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

/** Creates the fictional seed users if they don't exist yet. Safe to call repeatedly. */
export async function ensureSeedUsers(): Promise<Map<string, Types.ObjectId>> {
  const ids = new Map<string, Types.ObjectId>()
  for (const u of SEED_USERS) {
    await UserModel.updateOne(
      { usernameLower: u.username },
      {
        $setOnInsert: {
          username: u.username,
          usernameLower: u.username,
          displayName: u.displayName,
          email: `${u.username}@${EMAIL_DOMAIN}`,
          passwordHash: NO_PASSWORD,
          isSeed: true,
        },
      },
      { upsert: true },
    )
  }
  const docs = await UserModel.find({ isSeed: true }).select('_id username').lean()
  for (const d of docs) ids.set(d.username, d._id)
  for (const u of SEED_USERS) {
    if (!ids.has(u.username)) throw new Error(`Seed user ${u.username} could not be created`)
  }
  return ids
}

/**
 * Creates a throwaway account with its own private sandbox: copies of the seed groups (with
 * chat history, comments and a SyncTree), personal lists, assigned tasks, a pending invite, a
 * join request to approve and a welcome DM. Nothing in the sandbox is visible to anyone else,
 * and the whole thing is deleted when the guest expires after 24h.
 */
export async function createGuestSession(): Promise<Session> {
  const seedIds = await ensureSeedUsers()

  const suffix = randomBytes(3).toString('hex')
  const guest = await UserModel.create({
    username: `guest_${suffix}`,
    usernameLower: `guest_${suffix}`,
    displayName: 'Guest',
    email: `guest-${suffix}-${Date.now().toString(36)}@${EMAIL_DOMAIN}`,
    passwordHash: NO_PASSWORD,
    isGuest: true,
    expiresAt: new Date(Date.now() + GUEST_TTL_MS),
  })
  const guestId = guest._id
  const id = (a: Actor) => (a === 'guest' ? guestId : seedIds.get(a)!)

  // Sandbox groups.
  const groupIdByName = new Map<string, Types.ObjectId>()
  for (const def of SEED_GROUPS) {
    const members = def.members.map(id)
    const group = await GroupModel.create({
      name: def.name,
      nameLower: groupNameKey(def.name, String(guestId)),
      demoOwner: guestId,
      owner: id(def.owner),
      members,
      invites: (def.invites ?? []).map(id),
      requests: (def.requests ?? []).map(id),
      isPrivate: def.isPrivate,
      tree: def.tree,
    })
    groupIdByName.set(def.name, group._id)

    const channel = await ChatChannelModel.create({
      type: 'group',
      group: group._id,
      participants: members,
    })
    group.chatChannel = channel._id
    await group.save()

    await GroupCommentModel.insertMany(
      def.comments.map((c, i) => ({
        group: group._id,
        author: id(c.author),
        message: c.message,
        createdAt: minutesAgo((def.comments.length - i) * 300),
      })),
    )
    const messages = await ChatMessageModel.insertMany(
      def.chat.map((m, i) => ({
        channel: channel._id,
        sender: id(m.from),
        text: m.text,
        createdAt: minutesAgo((def.chat.length - i) * 37),
      })),
    )
    const last = messages.at(-1)
    if (last) {
      await ChatChannelModel.updateOne(
        { _id: channel._id },
        {
          lastMessage: { text: last.text, sender: last.sender, at: last.createdAt },
          lastActivityAt: last.createdAt,
        },
      )
    }
  }

  // Personal lists and tasks.
  for (const list of GUEST_LISTS) {
    const doc = await TaskListModel.create({ owner: guestId, title: list.title })
    await TaskModel.insertMany(
      list.tasks.map((t) => ({
        owner: guestId,
        list: doc._id,
        title: t.title,
        description: t.description ?? '',
        deadline: t.dueInDays === undefined ? null : endOfDayIn(t.dueInDays),
        completedAt: t.done ? minutesAgo(90) : null,
      })),
    )
  }

  // Tasks assigned to the guest by group owners.
  await TaskModel.insertMany(
    GUEST_GROUP_TASKS.flatMap((t) => {
      const groupId = groupIdByName.get(t.group)
      const def = SEED_GROUPS.find((g) => g.name === t.group)
      if (!groupId || !def) return []
      return [
        {
          owner: guestId,
          group: groupId,
          assignedBy: id(def.owner),
          title: t.title,
          description: t.description ?? '',
          deadline: t.dueInDays === undefined ? null : endOfDayIn(t.dueInDays),
          completedAt: t.done ? minutesAgo(30) : null,
        },
      ]
    }),
  )

  // A welcome DM.
  const peerId = id(GUEST_DM.from)
  const dm = await ChatChannelModel.create({
    type: 'direct',
    participants: [peerId, guestId],
    directKey: directKeyFor(String(peerId), String(guestId)),
  })
  const dmMessages = await ChatMessageModel.insertMany(
    GUEST_DM.messages.map((text, i) => ({
      channel: dm._id,
      sender: peerId,
      text,
      createdAt: minutesAgo(GUEST_DM.messages.length - i),
    })),
  )
  const lastDm = dmMessages.at(-1)!
  await ChatChannelModel.updateOne(
    { _id: dm._id },
    {
      lastMessage: { text: lastDm.text, sender: peerId, at: lastDm.createdAt },
      lastActivityAt: lastDm.createdAt,
    },
  )

  return { token: signToken(String(guestId)), user: toPrivateUser(guest) }
}

export async function purgeExpiredGuests(): Promise<number> {
  const expired = await UserModel.find({ isGuest: true, expiresAt: { $lt: new Date() } })
    .select('_id')
    .limit(100)
    .lean()
  for (const u of expired) await deleteUserCascade(String(u._id))
  if (expired.length) logger.info({ count: expired.length }, 'Purged expired demo guests')
  return expired.length
}

/** Seeds fixtures and schedules guest cleanup. Returns a stop function. */
export async function startDemoMode(): Promise<() => void> {
  await ensureSeedUsers()
  await purgeExpiredGuests()
  const timer = setInterval(
    () => void purgeExpiredGuests().catch((err) => logger.error({ err }, 'Guest purge failed')),
    30 * 60_000,
  )
  timer.unref()
  return () => clearInterval(timer)
}
