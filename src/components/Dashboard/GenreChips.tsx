import { useNavigate } from 'react-router-dom'
import { useGenres } from '../../stores/livestore/hooks'
import { useUIStore } from '../../stores/uiStore'

const GenreChips = () => {
  const genres = useGenres()
  const navigate = useNavigate()
  const setFilter = useUIStore(s => s.setFilter)
  const clearFilters = useUIStore(s => s.clearFilters)
  const topGenres = genres.slice(0, 8)

  if (!topGenres.length) return null

  const handleClick = (genre: string) => {
    clearFilters()
    setFilter('genres', [genre])
    navigate('/collection')
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 px-4 text-xl text-base-content">Genres You Love</h2>
      <div className="flex flex-wrap gap-3 px-4">
        {topGenres.map(genre => (
          <button
            key={genre.name}
            onClick={() => handleClick(genre.name)}
            className="btn btn-sm btn-outline rounded-full"
          >
            {genre.name}
            <span className="badge badge-sm ml-1">{genre.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default GenreChips
