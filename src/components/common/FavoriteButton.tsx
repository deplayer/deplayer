import React from 'react'
import { useAppStore } from '../../stores/livestore/store'
import { useFavoriteIds } from '../../stores/livestore/hooks'
import { toggleFavoriteAction } from '../../stores/livestore/actions'

interface Props {
  songId: string
  className?: string
  favoriteIds?: Set<string> // Optional: pass from parent to avoid N+1 query subscriptions
}

/**
 * FavoriteButton - Toggle favorite status for a song
 * 
 * PERFORMANCE: When rendered in a list, pass `favoriteIds` from the parent
 * to share a single query subscription. Falls back to its own hook when
 * rendered standalone (e.g., SongView).
 */
const FavoriteButton: React.FC<Props> = React.memo(({ songId, className = '', favoriteIds: favoriteIdsProp }) => {
  const liveStore = useAppStore()
  // When rendered in a list, parent passes favoriteIds — skip the query
  // When standalone, run own query (pass undefined to hook to get real data)
  const favoriteIdsFromHook = useFavoriteIds(favoriteIdsProp !== undefined)
  const favoriteIds = favoriteIdsProp ?? favoriteIdsFromHook
  const isFavorite = favoriteIds.has(songId)

  const toggleFavorite = React.useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (!liveStore) return
    
    try {
      await toggleFavoriteAction(liveStore, songId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [liveStore, songId])

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 focus:outline-none ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </button>
  )
})

FavoriteButton.displayName = 'FavoriteButton'

export default FavoriteButton