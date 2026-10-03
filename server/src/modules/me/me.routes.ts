import { Router } from 'express'
import { auth, requireAuth } from '../../middleware/auth.js'
import { imageUpload } from '../../middleware/upload.js'
import { parse } from '../../middleware/validate.js'
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from './me.schemas.js'
import * as me from './me.service.js'

export const meRouter = Router()
meRouter.use(requireAuth)

meRouter.get('/', async (req, res) => {
  res.json(await me.getMe(auth(req).userId))
})

meRouter.patch('/', async (req, res) => {
  res.json(await me.updateProfile(auth(req).userId, parse(updateProfileSchema, req.body)))
})

meRouter.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = parse(changePasswordSchema, req.body)
  await me.changePassword(auth(req).userId, currentPassword, newPassword)
  res.status(204).end()
})

meRouter.put('/avatar', imageUpload('avatar'), async (req, res) => {
  res.json(await me.setAvatar(auth(req).userId, req.file?.buffer))
})

meRouter.delete('/avatar', async (req, res) => {
  res.json(await me.removeAvatar(auth(req).userId))
})

meRouter.delete('/', async (req, res) => {
  const { password } = parse(deleteAccountSchema, req.body)
  await me.deleteAccount(auth(req).userId, password)
  res.status(204).end()
})
