import { z } from 'zod'
import { objectId } from '../../lib/object-id.js'

export const groupNameSchema = z
  .string()
  .trim()
  .min(3, 'Group name must be 3-30 characters')
  .max(30, 'Group name must be 3-30 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9 -]*$/,
    'Group name can only contain letters, numbers, spaces and hyphens',
  )
  .transform((s) => s.replace(/\s+/g, ' '))

export const createGroupSchema = z.object({
  name: groupNameSchema,
  isPrivate: z.boolean().default(true),
})

export const updateGroupSchema = z
  .object({ name: groupNameSchema.optional(), isPrivate: z.boolean().optional() })
  .strict()

export const userIdBody = z.object({ userId: objectId })
export const groupUserParams = z.object({ id: objectId, userId: objectId })
export const commentSchema = z.object({
  message: z.string().trim().min(1, 'Comment is empty').max(200),
})
