import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import HorizontalSlider from '../HorizontalSlider'
import CoverImage from '../MusicTable/CoverImage'
import type Album from '../../entities/Album'

const AlbumCover = ({ albumName, albumId, thumbnailUrl }: { albumName: string, albumId: string, thumbnailUrl: string }) => {
  return (
    <div className='flex items-start rounded justify-center w-32 h-60 mx-4'>
      <Link to={`/album/${albumId}`} className='flex flex-col items-start justify-center'>
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

type Props = {
  albums: Array<Album>
}

const RelatedAlbums = (props: Props) => {
  const title = <Translate value='titles.albums' />

  const Albums = props.albums
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

  return (
    <HorizontalSlider
      title={title}
      items={Albums}
    />
  )
}

export default RelatedAlbums
