import { Router } from 'express'
import { env } from '../../config/env.js'
import { notFound } from '../../lib/http-error.js'
import { authLimiter, demoLimiter } from '../../middleware/rate-limit.js'
import { parse } from '../../middleware/validate.js'
import { createGuestSession } from '../demo/demo.service.js'
import { loginSchema, signupSchema } from './auth.schemas.js'
import { login, signup } from './auth.service.js'

export const authRouter = Router()

authRouter.post('/signup', authLimiter, async (req, res) => {
  res.status(201).json(await signup(parse(signupSchema, req.body)))
})

authRouter.post('/login', authLimiter, async (req, res) => {
  res.json(await login(parse(loginSchema, req.body)))
})

authRouter.post('/demo', demoLimiter, async (_req, res) => {
  if (!env.DEMO_ENABLED) throw notFound('Demo')
  res.status(201).json(await createGuestSession())
})
