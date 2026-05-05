import { useMemo } from 'react'
import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { getLocalRecommendations } from '../../../services/Recommendations/RecommendationService'

/**
 * Hook that returns "Because you listened to X" recommendations.
 * Uses local genre analysis to find similar songs in the library.
 *
 * @param artistId - Source artist ID
 * @param _artistName - Source artist name (reserved for future Last.fm lookup)
 * @param genres - Source genres to match against
 * @param limit - Max results (default 15)
 */
export const useRecommendations = (
  artistId: string | undefined,
  _artistName: string | undefined,
  genres: string[],
  limit = 15
) => {
  const store = useAppStore()

  // Scoped query: exclude source artist at SQL level and cap candidate pool
  // Previously loaded the entire media table; now limited to 200 top-played candidates
  const query = useMemo(() => {
    if (!artistId) return tables.media
      .select('id', 'title', 'artistId', 'artistName', 'genresFlat', 'playCount', 'cover')
      .where('id', '=', '__NONE__')
    return tables.media
      .select('id', 'title', 'artistId', 'artistName', 'genresFlat', 'playCount', 'cover')
      .where({ artistId: { op: 'NOT IN', value: [artistId] } })
      .orderBy('playCount', 'desc')
      .limit(200)
  }, [artistId])

  const library = store.useQuery(queryDb(query))

  return useMemo(() => {
    if (!artistId || !genres.length || !Array.isArray(library)) return []

    const parsedLibrary = library.map((item: { id: string; title: string; artistId: string; artistName: string; genresFlat: string; playCount: number; cover: unknown }) => ({
      ...item,
      genres: item.genresFlat ? item.genresFlat.split(',').map((g: string) => g.trim()) : [],
    }))

    return getLocalRecommendations({
      sourceArtistId: artistId,
      sourceGenres: genres,
      library: parsedLibrary,
      limit,
    })
  }, [artistId, genres, library, limit])
}
