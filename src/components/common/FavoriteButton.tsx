import React from 'react'
import { useStore } from '@livestore/react'
import { useFavoriteIds } from '../../stores/livestore/hooks'
import { toggleFavoriteAction } from '../../stores/livestore/actions'

interface Props {
  songId: string
  className?: string
}

/**
 * FavoriteButton - Toggle favorite status for a song
 * 
 * PERFORMANCE: Uses useFavoriteIds() which loads all favorites once as a Set,
 * instead of useIsFavorite(songId) which runs a separate query per song.
 * This is critical for lists with many songs (e.g., artist view with 100+ tracks).
 */
const FavoriteButton: React.FC<Props> = React.memo(({ songId, className = '' }) => {
  const { store: liveStore } = useStore()
  // Use shared Set of all favorite IDs - single query for all songs
  const favoriteIds = useFavoriteIds()
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