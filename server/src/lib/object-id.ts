import { Types } from 'mongoose'
import { z } from 'zod'

export const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v) && String(new Types.ObjectId(v)) === v, {
    message: 'Invalid id',
  })

export const idParams = z.object({ id: objectId })

export const toId = (v: string | Types.ObjectId) =>
  typeof v === 'string' ? new Types.ObjectId(v) : v
export const sameId = (a: Types.ObjectId | string, b: Types.ObjectId | string) =>
  String(a) === String(b)
