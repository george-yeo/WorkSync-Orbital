import { z } from 'zod'
import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  usernameSchema,
} from '../users/user.schemas.js'

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    displayName: displayNameSchema.optional(),
    email: emailSchema.optional(),
  })
  .strict()

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(200),
  newPassword: passwordSchema,
})

export const deleteAccountSchema = z.object({ password: z.string().max(200).optional() })
