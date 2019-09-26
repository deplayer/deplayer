import * as React from 'react'
import * as types from '../../constants/ActionTypes'

type Props = {
  playlist: any,
  collection: any,
  dispatch: any
}

const Playlist = (props: Props) => {
  const { playlist, collection, dispatch } = props

  const [showSongs, setShowSongs] = React.useState(false)

  const songs = playlist.trackIds.map((songId: string) => {
    const song = collection.rows[songId]

    return (
      <li key={songId}>
        { song.title + ' - ' + song.artist.name }
      </li>
    )
  })

  return (
    <div className='card'>
      <div className='card-body'>
        <h3>
          { playlist._id }
          <div className='badge'>
            { playlist.trackIds.length }
          </div>
        </h3>

        <div className='btn-group'>
          <button
            className='btn-secondary'
            onClick={() => setShowSongs(!showSongs)}
          >
            Show songs
            <i className={`fa ${showSongs ? 'fa-chevron-down' : 'fa-chevron-right' }`} />
          </button>

          <button
            className='btn-info'
            onClick={() => {
              dispatch({
                type: types.ADD_SONGS_TO_QUEUE_BY_ID,
                trackIds: playlist.trackIds,
                replace: true
              })

              dispatch({ type: types.SET_CURRENT_PLAYING, songId: playlist.trackIds[0] })

              dispatch({ type: types.START_PLAYING })
            }}
          >
            Play
            <i className='fa fa-play' />
          </button>
        </div>

        { showSongs &&
          <ul className='media'>
            { songs }
          </ul>
        }
      </div>
    </div>
  )
}

export default Playlist
