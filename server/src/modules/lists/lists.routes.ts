import { Router } from 'express'
import { z } from 'zod'
import { badRequest, notFound } from '../../lib/http-error.js'
import { idParams } from '../../lib/object-id.js'
import { auth, requireAuth } from '../../middleware/auth.js'
import { parse } from '../../middleware/validate.js'
import { TaskListModel, TaskModel, type TaskList } from '../../models/index.js'
import type { Types } from 'mongoose'

const MAX_LISTS = 50

const listBody = z.object({ title: z.string().trim().min(1, 'Title is required').max(60) })

export interface TaskListDto {
  id: string
  title: string
  createdAt: string
}

const toDto = (l: TaskList & { _id: Types.ObjectId }): TaskListDto => ({
  id: String(l._id),
  title: l.title,
  createdAt: l.createdAt.toISOString(),
})

export const listsRouter = Router()
listsRouter.use(requireAuth)

listsRouter.get('/', async (req, res) => {
  const lists = await TaskListModel.find({ owner: auth(req).userId })
    .sort({ createdAt: 1 })
    .lean()
  res.json(lists.map(toDto))
})

listsRouter.post('/', async (req, res) => {
  const { userId } = auth(req)
  const { title } = parse(listBody, req.body)
  if ((await TaskListModel.countDocuments({ owner: userId })) >= MAX_LISTS) {
    throw badRequest(`You can have at most ${MAX_LISTS} lists`)
  }
  const list = await TaskListModel.create({ owner: userId, title })
  res.status(201).json(toDto(list))
})

listsRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { title } = parse(listBody, req.body)
  const list = await TaskListModel.findOneAndUpdate(
    { _id: id, owner: auth(req).userId },
    { title },
    { returnDocument: 'after' },
  ).lean()
  if (!list) throw notFound('List')
  res.json(toDto(list))
})

listsRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { userId } = auth(req)
  const list = await TaskListModel.findOneAndDelete({ _id: id, owner: userId })
  if (!list) throw notFound('List')
  await TaskModel.deleteMany({ list: list._id, owner: userId })
  res.status(204).end()
})
