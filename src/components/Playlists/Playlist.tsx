import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'
import CoverImage from '../MusicTable/CoverImage'
import Tag from '../common/Tag'
import { State as CollectionState } from '../../reducers/collection'
import Modal from '../common/Modal'
import SongRow from '../MusicTable/SongRow'
import { applyFilters } from '../../utils/apply-filters'

type Props = {
  playlist: {
    _id: string,
    trackIds: Array<string>,
    filters?: Record<string, string[]>,
    id?: string,
    name?: string
  }
  collection: CollectionState
  dispatch: any
}

const Playlist = (props: Props) => {
  const { playlist, collection, dispatch } = props
  const [showSongs, setShowSongs] = React.useState(false)

  // Determine if this is a smart playlist
  const isSmartPlaylist = 'filters' in playlist

  // Get the relevant song IDs based on playlist type
  const songIds = isSmartPlaylist 
    ? applyFilters(collection.rows, {
        genres: playlist.filters?.genres || [],
        types: playlist.filters?.types || [],
        artists: playlist.filters?.artists || [],
        providers: playlist.filters?.providers || []
      })
    : playlist.trackIds

  const songs = songIds.map((songId: string) => {
    const song = collection.rows[songId]
    if (!song) return null

    return (
      <SongRow
        key={song.id}
        mqlMatch={false}
        songsLength={song.length}
        disableCovers
        style={{}}
        dispatch={props.dispatch}
        isCurrent={false}
        slim={true}
        onClick={() => {
          props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
        }}
        song={song}
      />
    )
  })

  const songDocs = songIds.map((songId: string) => collection.rows[songId])
  const songsWithCovers = songDocs.filter((song: any) => {
    return song?.album?.thumbnailUrl && song?.album?.thumbnailUrl !== '/disc.svg'
  })
  const randomSongCovers = songsWithCovers.slice(0, 3)
  const covers = randomSongCovers.map((song: any, index: number) => {
    const rotation = Math.random()
    const zIndex = 20 - index
    return (
      <div key={song.id} className={`w-32 h-32`} style={{ marginRight: '-50px', transform: `rotate(${rotation})deg`, zIndex }}>
        <CoverImage
          cover={song.cover}
          size='thumbnail'
          useImage={true}
          albumName={'N/A'}
        />
      </div>
    )
  })

  return (
    <div key={isSmartPlaylist ? playlist.id : playlist._id} 
         className='flex flex-row justify-between overflow-hidden h-32 relative content-center my-4 px-12 py-12'>
      <div className='flex absolute top-0 left-0 z-0 opacity-20 hover:opacity-50 px-8'>
        {covers}
      </div>

      <div className='z-10 flex self-start'>
        <h3 className='text-2xl mr-4'>
          {isSmartPlaylist ? playlist.name : playlist._id}
        </h3>
        {isSmartPlaylist && (
          <div className='text-sm opacity-70 mt-2'>
            {Object.entries(playlist.filters || {})
              .filter(([_, values]) => values.length > 0)
              .map(([key, values]) => (
                <Tag key={key} className='mr-2'>
                  {key}: {values.join(', ')}
                </Tag>
              ))}
          </div>
        )}
      </div>

      <div className='flex my-4 z-10 self-center'>
        <Button
          inverted
          onClick={() => setShowSongs(!showSongs)}
        >
          <Tag>{songIds.length}</Tag>
          <span className='ml-4'>Show songs</span>
          {showSongs ? <Icon className='pl-2' icon='faChevronDown' /> : <Icon className='pl-2' icon='faChevronRight' />}
        </Button>

        <Button
          onClick={() => {
            dispatch({
              type: types.ADD_SONGS_TO_QUEUE_BY_ID,
              trackIds: songIds,
              replace: true
            })

            dispatch({ type: types.SET_CURRENT_PLAYING, songId: songIds[0] })
            dispatch({ type: types.START_PLAYING })
          }}
        >
          Play
          <Icon className='pl-2' icon='faPlayCircle' />
        </Button>

        {isSmartPlaylist && (
          <>
            <Button
              onClick={() => {
                dispatch({
                  type: types.SET_COLLECTION_FILTER,
                  filters: playlist.filters
                })
              }}
            >
              Apply Filters
              <Icon className='pl-2' icon='faFilter' />
            </Button>
            
            <Button
              onClick={() => {
                dispatch({
                  type: types.DELETE_SMART_PLAYLIST,
                  id: playlist.id
                })
              }}
            >
              Delete
              <Icon className='pl-2' icon='faTrash' />
            </Button>
          </>
        )}
      </div>

      {showSongs && (
        <Modal
          title={isSmartPlaylist ? playlist.name : playlist._id}
          onClose={() => {
            setShowSongs(false)
          }}
        >
          <ul className='media'>
            {songs}
          </ul>
        </Modal>
      )}
    </div>
  )
}

export default Playlist
