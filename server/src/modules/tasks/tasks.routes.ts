import { Router } from 'express'
import { idParams } from '../../lib/object-id.js'
import { auth, requireAuth } from '../../middleware/auth.js'
import { parse } from '../../middleware/validate.js'
import { createTaskSchema, updateTaskSchema } from './task.schemas.js'
import * as tasks from './tasks.service.js'

export const tasksRouter = Router()
tasksRouter.use(requireAuth)

tasksRouter.get('/', async (req, res) => {
  res.json(await tasks.listTasks(auth(req).userId))
})

tasksRouter.post('/', async (req, res) => {
  res.status(201).json(await tasks.createTask(auth(req).userId, parse(createTaskSchema, req.body)))
})

tasksRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await tasks.updateTask(auth(req).userId, id, parse(updateTaskSchema, req.body)))
})

tasksRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params)
  await tasks.deleteTask(auth(req).userId, id)
  res.status(204).end()
})
