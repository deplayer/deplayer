import * as React from 'react'
import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'
import Media from '../../entities/Media'
import SongRow from '../MusicTable/SongRow'
import CoverImage from '../MusicTable/CoverImage'

type AlbumProps = {
  album: any,
  songs: Array<string>,
  collection: any,
  dispatch: any
}

const Album = (props: AlbumProps) => {
  const albumId = props.album.id

  const extractSongs = () => {
    if (!props.songs) {
      return null
    }

    return props.songs.map((songId) => {
      const songRow = props.collection.rows[songId]
      const songObj = new Media(songRow)
      return (
        <SongRow
          songsLength={props.songs.length}
          mqlMatch={false}
          disableCovers
          style={ {} }
          key={ songId }
          dispatch={props.dispatch}
          isCurrent={ false }
          slim={ true }
          onClick={() => {
            props.dispatch({type: types.SET_CURRENT_PLAYING, songId: songObj.id})
          }}
          song={songObj}
        />
      )
    })
  }

  return (
    <div className='mx-0 z-4 flex flex-col md:flex-row items-center md:items-start md:items-start mb-16' key={albumId}>
      <div style={{ top: 50 }} className='md:sticky flex flex-col items-center md:mr-8'>
        <h3 className='text-lg mb-2'>{ props.album.name }</h3>
        <div
          className='h-56 w-56 mb-2 md:h-56 md:w-56 cursor-pointer md:mr-4'
          onClick={() => {
            props.dispatch({type: types.ADD_ALBUM_TO_PLAYLIST, albumId })
          }}
        >
          <CoverImage
            cover={
              props.collection.rows[props.songs[0]].cover
            }
            size='thumbnail'
            albumName={'N/A'}
          />
        </div>

        <Button
          transparent
          onClick={() => {
            props.dispatch({type: types.ADD_ALBUM_TO_PLAYLIST, albumId })
          }}
        >
          <Icon
            icon='faFolderPlus'
            className='mx-2'
          />
          <Translate value='buttons.addToQueue' />
        </Button>
      </div>
      <div className='w-full m-2'>
        { extractSongs() }
      </div>
    </div>
  )
}
export default Album
