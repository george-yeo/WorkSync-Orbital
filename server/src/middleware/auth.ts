import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { unauthorized } from '../lib/http-error.js'
import { UserModel } from '../models/index.js'

export interface AuthContext {
  userId: string
  isGuest: boolean
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext
  }
}

export function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

/** Verifies the JWT *and* that the account still exists (deleted/expired users are rejected). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearerToken(req.headers.authorization)
  const userId = token ? verifyToken(token) : null
  if (!userId) return next(unauthorized())

  const user = await UserModel.findById(userId).select('_id isGuest').lean()
  if (!user) return next(unauthorized('Your session has expired, please log in again'))

  req.auth = { userId: String(user._id), isGuest: user.isGuest }
  next()
}

/** Typed accessor for handlers mounted behind requireAuth. */
export function auth(req: Request): AuthContext {
  if (!req.auth) throw unauthorized()
  return req.auth
}
