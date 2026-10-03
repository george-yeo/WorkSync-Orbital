import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from '../users/user.schemas.js'

export const signupSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1, 'Password is required').max(200),
})
