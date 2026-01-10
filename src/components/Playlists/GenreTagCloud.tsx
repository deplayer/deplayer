import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'
import { useGenres } from '../../stores/livestore/hooks'

interface GenreTag {
  name: string
  count: number
  weight: number // 1-5 scale for font size
}

type Props = {
  dispatch: Dispatch
}

const GenreTagCloud = ({ dispatch }: Props) => {
  const navigate = useNavigate()
  const genres = useGenres()

  const genreTags = useMemo(() => {
    // Find max count for weight calculation
    const maxCount = Math.max(...genres.map(g => g.count), 1)

    // Convert to GenreTag array with weights
    return genres.map(({ name, count }): GenreTag => ({
      name,
      count,
      weight: Math.ceil((count / maxCount) * 5) || 1
    }))
  }, [genres])

  if (genreTags.length === 0) {
    return null
  }

  return (
    <div className="card bg-base-200 shadow-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">
        <Translate value="titles.genres" />
      </h2>
      <div className="flex flex-wrap gap-3">
        {genreTags.map(({ name, count, weight }) => (
          <button
            key={name}
            onClick={() => {
              dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
              dispatch({
                type: types.SET_COLLECTION_FILTER,
                filterType: 'genres',
                values: [name]
              })
              navigate('/collection')
            }}
            className="px-3 py-2 rounded-full bg-base-300 hover:bg-primary/20 transition-colors duration-200"
            style={{
              fontSize: `${0.875 + (weight * 0.125)}rem`,
              opacity: 0.6 + (weight * 0.08)
            }}
          >
            {name}
            <span className="ml-2 text-xs opacity-50">({count})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default GenreTagCloud 