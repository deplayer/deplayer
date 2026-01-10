import { useStore } from '@livestore/react'
import { useIsFavorite } from '../../stores/livestore/hooks'
import { toggleFavoriteAction } from '../../stores/livestore/actions'

interface Props {
  songId: string
  className?: string
}

const FavoriteButton: React.FC<Props> = ({ songId, className = '' }) => {
  const { store: liveStore } = useStore()
  const isFavorite = useIsFavorite(songId)

  const toggleFavorite = async () => {
    if (!liveStore) return
    
    try {
      await toggleFavoriteAction(liveStore, songId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

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
}

export default FavoriteButton