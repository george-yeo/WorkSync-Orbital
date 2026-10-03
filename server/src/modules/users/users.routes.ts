import { Router } from 'express'
import { idParams } from '../../lib/object-id.js'
import { notFound } from '../../lib/http-error.js'
import { auth, requireAuth } from '../../middleware/auth.js'
import { parse } from '../../middleware/validate.js'
import { UserModel } from '../../models/index.js'
import { searchQuery } from './user.schemas.js'
import { searchUsers } from './users.service.js'

export const usersRouter = Router()

// Avatars are public so they can be used directly in <img src>; ids are not secrets.
usersRouter.get('/:id/avatar', async (req, res) => {
  const { id } = parse(idParams, req.params)
  const user = await UserModel.findById(id).select('+avatar').lean()
  if (!user?.avatar?.data) throw notFound('Avatar')
  res
    .type(user.avatar.contentType ?? 'image/webp')
    .set('Cache-Control', 'public, max-age=31536000, immutable')
    .send(user.avatar.data)
})

usersRouter.get('/search', requireAuth, async (req, res) => {
  const { q } = parse(searchQuery, req.query)
  res.json(await searchUsers(q, auth(req)))
})
