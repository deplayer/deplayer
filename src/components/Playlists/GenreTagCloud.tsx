import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import { State as CollectionState } from '../../reducers/collection'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'

interface GenreTag {
  name: string
  count: number
  weight: number // 1-5 scale for font size
}

type Props = {
  collection: CollectionState
  dispatch: Dispatch
}

const GenreTagCloud = ({ collection, dispatch }: Props) => {
  const navigate = useNavigate()

  const genreTags = useMemo(() => {
    // Get all tracks from collection
    const tracks = Object.values(collection.rows)
    
    // Count genres
    const genreCounts = tracks.reduce((acc: { [key: string]: number }, track) => {
      if (track?.genres?.length) {
        track.genres.forEach(genre => {
          acc[genre] = (acc[genre] || 0) + 1
        })
      }
      return acc
    }, {})

    // Find max count for weight calculation
    const maxCount = Math.max(...Object.values(genreCounts))

    // Convert to GenreTag array with weights
    return Object.entries(genreCounts)
      .map(([name, count]): GenreTag => ({
        name,
        count,
        weight: Math.ceil((count / maxCount) * 5) || 1
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }, [collection.rows])

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