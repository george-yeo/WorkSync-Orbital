import { z } from 'zod'
import { objectId } from '../../lib/object-id.js'

const title = z.string().trim().min(1, 'Title is required').max(120)
const description = z.string().trim().max(2000)
/** Accepts an ISO date or date-time; null clears the deadline. */
const deadline = z.iso
  .datetime({ offset: true })
  .or(z.iso.date())
  .transform((s) => new Date(s))
  .nullable()

export const taskContentSchema = z.object({
  title,
  description: description.optional().default(''),
  deadline: deadline.optional().default(null),
})

export const createTaskSchema = taskContentSchema
  .extend({ listId: objectId.optional(), groupId: objectId.optional() })
  .refine((v) => Boolean(v.listId) !== Boolean(v.groupId), {
    message: 'A task must belong to exactly one list or group',
    path: ['listId'],
  })

export const updateTaskSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    deadline: deadline.optional(),
    completed: z.boolean().optional(),
  })
  .strict()
