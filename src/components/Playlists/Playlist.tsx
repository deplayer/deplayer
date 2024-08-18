import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'
import CoverImage from '../MusicTable/CoverImage'
import Tag from '../common/Tag'
import { State as CollectionState } from '../../reducers/collection'
import Modal from '../common/Modal'
import SongRow from '../MusicTable/SongRow'

type Props = {
  playlist: { _id: string, trackIds: Array<string> }
  collection: CollectionState
  dispatch: any
}

const Playlist = (props: Props) => {
  const { playlist, collection, dispatch } = props

  const [showSongs, setShowSongs] = React.useState(false)

  const songs = playlist.trackIds.map((songId: string) => {
    const song = collection.rows[songId]

    if (!song) {
      return null
    }

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

  const songDocs = playlist.trackIds.map((songId: string) => {
    return collection.rows[songId]
  })
  const songsWithCovers = songDocs.filter((song: any) => {
    return song.album.thumbnailUrl && song.album.thumbnailUrl !== '/disc.svg'
  })
  const randomSongCovers = songsWithCovers.slice(0, 3)
  const covers = randomSongCovers.map((song: any) => {
    const rotation = Math.random()
    return (
      <div key={song.id} className='w-32 h-32' style={{ marginRight: '-50px', transform: `rotate(${rotation})deg` }}>
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
    <div key={playlist._id} className='flex flex-row justify-between overflow-hidden h-32 relative content-center my-4 px-12 py-12'>
      <div className='flex absolute top-0 left-0 z-0 opacity-20 hover:opacity-50 px-8'>
        {covers}
      </div>

      <div className='z-10 flex self-start'>
        <h3 className='text-2xl mr-4'>
          {playlist._id}
        </h3>
      </div>

      <div className='flex my-4 z-10 self-center'>
        <Button
          inverted
          onClick={() => setShowSongs(!showSongs)}
        >
          <Tag>{playlist.trackIds.length}</Tag><span className='ml-4'>Show songs</span>
          {showSongs ? <Icon className='pl-2' icon='faChevronDown' /> : <Icon className='pl-2' icon='faChevronRight' />}
        </Button>

        <Button
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
          <Icon className='pl-2' icon='faPlayCircle' />
        </Button>
      </div>

      {
        showSongs && <Modal
          onClose={() => {
            setShowSongs(false)
          }}
        >
          <ul className='media'>
            {songs}
          </ul>
        </Modal>
      }
    </div>
  )
}

export default Playlist
