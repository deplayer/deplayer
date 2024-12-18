import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'
import SongRow from '../MusicTable/SongRow'
import CoverImage from '../MusicTable/CoverImage'

interface Album {
  id: string
  name: string
  year?: number
}

type AlbumProps = {
  album: Album,
  queue: any,
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
      return (
        <SongRow
          songsLength={props.songs.length}
          mqlMatch={false}
          disableCovers
          style={{}}
          key={songId}
          dispatch={props.dispatch}
          isCurrent={false}
          slim={true}
          onClick={() => {
            props.dispatch({ type: types.ADD_ALBUM_TO_QUEUE, albumId })
          }}
          song={songRow}
        />
      )
    })
  }

  return (
    <div 
      className='mx-0 z-4 flex flex-col md:flex-row items-center md:items-start mb-16' 
      key={albumId}
    >
      <div className='sticky backdrop-blur-sm bg-black/30 md:bg-transparent shadow-lg md:shadow-none py-4 top-0 mt-0 w-full md:w-56 flex md:flex-col items-center md:mx-8 z-10'>
        <div
          className='h-56 w-56 mb-2 p-4 md:h-56 md:w-56 cursor-pointer md:mr-4'
          onClick={() => {
            props.dispatch({ type: types.ADD_ALBUM_TO_QUEUE, albumId })
          }}
        >
          <CoverImage
            cover={
              props.collection.rows[props.songs[0]].cover
            }
            size='thumbnail'
            albumName={props.album.name}
          />
        </div>
        <div>
          <h3 className='text-lg p-4 w-56'>{props.album.name}</h3>
            { props.album.year && <h4 className='text-md p-4 w-56'>{props.album.year}</h4>}
          <Button
            transparent
            onClick={() => {
              props.dispatch({ type: types.ADD_ALBUM_TO_QUEUE, albumId })
            }}
          >
            <Icon
              icon='faFolderPlus'
              className='mx-2'
            />
            <Translate value='buttons.addToQueue' />
          </Button>

          <Button
            transparent
            onClick={() => {
              props.dispatch({ type: types.PIN_ALBUM, albumId })
            }}
          >
            <Icon
              icon='faFolderPlus'
              className='mx-2'
            />
            <Translate value='buttons.pinAlbum' />
          </Button>
        </div>
      </div>
      <div className='w-full m-2'>
        {extractSongs()}
      </div>
    </div>
  )
}
export default Album
