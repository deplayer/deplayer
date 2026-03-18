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

  const library = store.useQuery(
    queryDb(
      tables.media
        .select('id', 'artistId', 'artistName', 'genresFlat', 'playCount')
        .orderBy('playCount', 'desc')
    )
  )

  return useMemo(() => {
    if (!artistId || !genres.length || !Array.isArray(library)) return []

    const parsedLibrary = library.map((item: any) => ({
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
