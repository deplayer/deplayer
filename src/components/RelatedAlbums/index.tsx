import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import HorizontalSlider from '../HorizontalSlider'
import CoverImage from '../MusicTable/CoverImage'
import type Album from '../../entities/Album'

const AlbumCover = ({ albumName, albumId, thumbnailUrl }: { albumName: string, albumId: string, thumbnailUrl: string }) => {
  return (
    <div className='block rounded w-32 h-48 mx-2'>
      <Link to={`/album/${albumId}`} className='flex flex-col items-start'>
        <div className='h-32 w-32'>
          <CoverImage
            reflect
            albumName={albumName}
            useImage
            cover={{
              thumbnailUrl: thumbnailUrl,
              fullUrl: thumbnailUrl
            }}
          />
        </div>
        <p className='py-4 whitespace-normal text-center truncate inline'>
          {albumName}
        </p>
      </Link>
    </div>
  )
}

// All items component
// Important! add unique key
export const Albums = (list: Array<Album>) => {
  return list
    .filter((album) => {
      return album.name !== '' // We don't want empty titles
    })
    .map((album) => {
      return (
        <AlbumCover
          key={album.id}
          albumName={album.name}
          albumId={album.id}
          thumbnailUrl={album.thumbnailUrl}
        />
      )
    })
}

type Props = {
  albums: Array<Album>
}

const RelatedAlbums = (props: Props) => {
  const albums = Albums(props.albums)
  const title = <Translate value='titles.albums' />


  return (
    <HorizontalSlider
      title={title}
      items={albums}
    />
  )
}

export default RelatedAlbums
