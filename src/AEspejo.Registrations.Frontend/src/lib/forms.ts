/**
 * Turns the text fields left empty into `null`. An empty input sends `''`, which for the API is not "no
 * value" but a value that fails validation: an empty e-mail fails `@Email`, and a nationality must be
 * exactly two characters. Optional fields have to travel as null.
 */
export function withNullsForEmpty<T extends object>(body: T): T {
  const clean = { ...body } as Record<string, unknown>

  for (const key of Object.keys(clean)) {
    if (typeof clean[key] === 'string' && (clean[key] as string).trim() === '') clean[key] = null
  }

  return clean as T
}
