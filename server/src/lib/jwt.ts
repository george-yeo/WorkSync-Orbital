import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

interface TokenPayload {
  sub: string
}

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

/** Returns the user id, or null if the token is missing, malformed, expired or forged. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
