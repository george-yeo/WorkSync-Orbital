import { rateLimit } from 'express-rate-limit'
import { isTest } from '../config/env.js'

const common = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: 'Too many requests, please slow down' },
}

export const apiLimiter = rateLimit({ ...common, windowMs: 60_000, limit: 300 })

/** Login/signup: slows down credential stuffing. Only failed attempts count. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60_000,
  limit: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts, please try again in a few minutes' },
})

/** Demo sessions create data, so cap them per IP. */
export const demoLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60_000,
  limit: 10,
  message: { error: 'Too many demo sessions from this network, please try again later' },
})
