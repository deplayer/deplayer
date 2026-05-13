type MediaItem = {
  id: string
  artistId: string
  artistName: string
  genres: string[]
  playCount: number
  [key: string]: unknown
}

type RecommendationParams = {
  sourceArtistId: string
  sourceGenres: string[]
  library: MediaItem[]
  limit?: number
  maxPerArtist?: number
}

/**
 * Get recommendations based on local genre analysis.
 * Finds songs sharing genres with source, excluding the source artist.
 * Ranks by genre overlap count, then playCount.
 * Limits per artist to ensure variety.
 */
export const getLocalRecommendations = ({
  sourceArtistId,
  sourceGenres,
  library,
  limit = 15,
  maxPerArtist = 2,
}: RecommendationParams): MediaItem[] => {
  if (!sourceGenres.length) return []

  const sourceGenreSet = new Set(sourceGenres)

  const scored = library.flatMap((item) => {
    if (item.artistId === sourceArtistId) return []
    const itemGenres = Array.isArray(item.genres)
      ? item.genres
      : typeof item.genres === 'string'
        ? JSON.parse(item.genres)
        : []
    const overlap = itemGenres.filter((g: string) => sourceGenreSet.has(g)).length
    return overlap > 0 ? [{ item, overlap }] : []
  })
  .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap
      return (b.item.playCount || 0) - (a.item.playCount || 0)
    })

  const artistCount: Record<string, number> = {}
  const results: MediaItem[] = []

  for (const { item } of scored) {
    const count = artistCount[item.artistId] || 0
    if (count >= maxPerArtist) continue
    artistCount[item.artistId] = count + 1
    results.push(item)
    if (results.length >= limit) break
  }

  return results
}
