/** Escape user input before embedding it in a RegExp / $regex (prevents ReDoS & regex injection). */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Case-insensitive prefix query against a pre-lowercased, indexed field. */
export function prefixQuery(input: string) {
  return { $regex: `^${escapeRegex(input.trim().toLowerCase())}` }
}
