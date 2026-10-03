import { Router } from 'express'
import { z } from 'zod'
import { idParams, objectId } from '../../lib/object-id.js'
import { auth, requireAuth } from '../../middleware/auth.js'
import { parse } from '../../middleware/validate.js'
import { searchQuery } from '../users/user.schemas.js'
import * as chat from './chat.service.js'

const messageBody = z.object({ text: z.string().trim().min(1, 'Message is empty').max(2000) })
const pageQuery = z.object({
  before: z.iso
    .datetime({ offset: true })
    .transform((s) => new Date(s))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export const chatRouter = Router()
chatRouter.use(requireAuth)

chatRouter.get('/', async (req, res) => {
  res.json(await chat.recentChannels(auth(req).userId))
})

chatRouter.get('/search', async (req, res) => {
  const { q } = parse(searchQuery, req.query)
  res.json(await chat.searchChannels(q, auth(req)))
})

chatRouter.get('/:id/messages', async (req, res) => {
  const { id } = parse(idParams, req.params)
  res.json(await chat.listMessages(id, auth(req).userId, parse(pageQuery, req.query)))
})

chatRouter.post('/:id/messages', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const { text } = parse(messageBody, req.body)
  res.status(201).json(await chat.sendMessage(id, auth(req).userId, text))
})

chatRouter.post('/direct/:userId/messages', async (req, res) => {
  const { userId: peerId } = parse(z.object({ userId: objectId }), req.params)
  const { text } = parse(messageBody, req.body)
  res.status(201).json(await chat.sendDirectMessage(peerId, auth(req), text))
})
