import { Router } from 'express'
import { conflict } from '../../lib/http-error.js'
import { idParams } from '../../lib/object-id.js'
import { auth, requireAuth } from '../../middleware/auth.js'
import { imageUpload } from '../../middleware/upload.js'
import { parse } from '../../middleware/validate.js'
import { searchQuery } from '../users/user.schemas.js'
import { taskContentSchema } from '../tasks/task.schemas.js'
import { assignTaskToGroup } from '../tasks/tasks.service.js'
import {
  commentSchema,
  createGroupSchema,
  groupUserParams,
  updateGroupSchema,
  userIdBody,
} from './group.schemas.js'
import * as groups from './groups.service.js'
import { plantTree } from './tree.service.js'

export const groupsRouter = Router()

// Public: used directly as <img src>.
groupsRouter.get('/:id/avatar', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const avatar = await groups.getGroupAvatar(id)
  res
    .type(avatar.contentType ?? 'image/webp')
    .set('Cache-Control', 'public, max-age=31536000, immutable')
    .send(avatar.data)
})

groupsRouter.use(requireAuth)

groupsRouter.get('/', async (req, res) => {
  res.json(await groups.listMyGroups(auth(req).userId))
})

groupsRouter.get('/invites', async (req, res) => {
  res.json(await groups.listMyInvites(auth(req).userId))
})

groupsRouter.get('/search', async (req, res) => {
  const { q } = parse(searchQuery, req.query)
  res.json(await groups.searchGroups(q, auth(req)))
})

groupsRouter.post('/', async (req, res) => {
  res.status(201).json(await groups.createGroup(auth(req), parse(createGroupSchema, req.body)))
})

groupsRouter.get('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await groups.getGroupDetail(id, auth(req).userId))
})

groupsRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await groups.updateGroup(id, auth(req).userId, parse(updateGroupSchema, req.body)))
})

groupsRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  await groups.deleteGroup(id, auth(req).userId)
  res.status(204).end()
})

groupsRouter.put('/:id/avatar', imageUpload('avatar'), async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await groups.setGroupAvatar(id, auth(req).userId, req.file?.buffer))
})

// --- invites (owner) ---
groupsRouter.post('/:id/invites', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { userId } = parse(userIdBody, req.body)
  res.status(201).json(await groups.invite(id, auth(req).userId, userId))
})

groupsRouter.delete('/:id/invites/:userId', async (req, res) => {
  const { id, userId } = parse(groupUserParams, req.params)
  res.json(await groups.revokeInvite(id, auth(req).userId, userId))
})

// --- invites (invitee) ---
groupsRouter.post('/:id/invites/accept', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await groups.acceptInvite(id, auth(req).userId))
})

groupsRouter.post('/:id/invites/decline', async (req, res) => {
  const { id } = parse(idParams, req.params)
  await groups.declineInvite(id, auth(req).userId)
  res.status(204).end()
})

// --- join requests ---
groupsRouter.post('/:id/requests', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const joined = await groups.requestToJoin(id, auth(req))
  if (joined) res.json(joined)
  else res.status(202).end()
})

groupsRouter.delete('/:id/requests', async (req, res) => {
  const { id } = parse(idParams, req.params)
  await groups.cancelJoinRequest(id, auth(req).userId)
  res.status(204).end()
})

groupsRouter.post('/:id/requests/:userId/approve', async (req, res) => {
  const { id, userId } = parse(groupUserParams, req.params)
  res.json(await groups.approveRequest(id, auth(req).userId, userId))
})

groupsRouter.post('/:id/requests/:userId/reject', async (req, res) => {
  const { id, userId } = parse(groupUserParams, req.params)
  res.json(await groups.rejectRequest(id, auth(req).userId, userId))
})

// --- membership ---
groupsRouter.delete('/:id/members/:userId', async (req, res) => {
  const { id, userId } = parse(groupUserParams, req.params)
  res.json(await groups.kickMember(id, auth(req).userId, userId))
})

groupsRouter.post('/:id/leave', async (req, res) => {
  const { id } = parse(idParams, req.params)
  await groups.leaveGroup(id, auth(req).userId)
  res.status(204).end()
})

// --- SyncTree, comments, group tasks ---
groupsRouter.post('/:id/tree', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { userId } = auth(req)
  await groups.loadAsMember(id, userId)
  if (!(await plantTree(id, userId))) throw conflict('A tree is already growing')
  res.json(await groups.getGroupDetail(id, userId))
})

groupsRouter.get('/:id/comments', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await groups.listComments(id, auth(req).userId))
})

groupsRouter.post('/:id/comments', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { message } = parse(commentSchema, req.body)
  res.status(201).json(await groups.addComment(id, auth(req).userId, message))
})

groupsRouter.post('/:id/tasks', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { userId } = auth(req)
  const members = await groups.membersForAssignment(id, userId)
  await assignTaskToGroup(id, userId, members, parse(taskContentSchema, req.body))
  res.status(201).json({ assigned: members.length })
})
