/**
 * Canonical genre normalization: trimmed, blanks dropped, deduplicated.
 *
 * The persistence layer derives both genre representations from this one
 * function, so the comma-joined `genresFlat` column and the `media_genres`
 * rows always describe the same list in the same form.
 *
 * A bare string is treated as a single genre (providers that report one
 * value), never split: a comma inside it would be a formatting bug, not a
 * separator.
 */
export const normalizeGenres = (input?: readonly string[] | string | null): string[] => {
  if (!input) return []
  const list = typeof input === 'string' ? [input] : input
  return Array.from(
    new Set(list.map((genre) => genre.trim()).filter((genre) => genre.length > 0))
  )
}

/**
 * Inverse of `normalizeGenres(...).join(',')`, the encoding used for the
 * `genresFlat` column: splits the CSV, trims entries, drops blanks.
 *
 * Lives beside its writer so the pair cannot drift.
 */
export const parseGenresCsv = (val: unknown): string[] => {
  if (typeof val !== 'string' || val.length === 0) return []
  return val
    .split(',')
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0)
}
