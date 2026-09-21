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
