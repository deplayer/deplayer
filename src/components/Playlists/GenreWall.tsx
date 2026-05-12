import { memo, useCallback } from 'react'
import { Translate } from 'react-redux-i18n'
import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import { useUIStore } from '../../stores/uiStore'

type Props = {
  genres: string[]
}

const GenreTile = memo(({ genre }: { genre: string }) => {
  const navigate = useNavigate()
  const setFilter = useUIStore(s => s.setFilter)
  const clearFilters = useUIStore(s => s.clearFilters)

  const onClick = useCallback(() => {
    clearFilters()
    setFilter('genres', [genre])
    navigate('/collection')
  }, [genre, clearFilters, setFilter, navigate])

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[3/2] rounded-box bg-base-200 hover:bg-base-300 transition-colors duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <span className="absolute inset-0 flex items-center justify-center px-3 text-xl md:text-2xl font-bold text-base-content text-center truncate">
        {genre}
      </span>
    </button>
  )
})

const GenreWall = memo(({ genres }: Props) => {
  if (!genres.length) return null

  return (
    <section className="mb-10 px-4">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon icon="faCompactDisc" />
          <Translate value="titles.genrePlaylists" />
        </h2>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {genres.map(genre => (
          <GenreTile key={genre} genre={genre} />
        ))}
      </div>
    </section>
  )
})

export default GenreWall
