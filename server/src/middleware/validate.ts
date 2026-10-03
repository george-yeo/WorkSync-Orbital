import type { z } from 'zod'
import { badRequest } from '../lib/http-error.js'

/** Parse untrusted input with a zod schema, turning failures into a 400 with field errors. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input ?? {})
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_'
      fields[key] ??= issue.message
    }
    const first = Object.values(fields)[0] ?? 'Invalid request'
    throw badRequest(first, { fields })
  }
  return result.data
}
