import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .min(4, 'Username must be 4-20 characters')
  .max(20, 'Username must be 4-20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')

export const displayNameSchema = z.string().trim().min(1, 'Display name is required').max(40)

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Enter a valid email address'))

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), {
    message: 'Password needs an uppercase letter, a lowercase letter and a number',
  })

export const searchQuery = z.object({ q: z.string().trim().min(1).max(40) })
