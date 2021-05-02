import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import HorizontalSlider from '../HorizontalSlider'
import CoverImage from '../MusicTable/CoverImage'

const AlbumCover = ({ album }) => {
  return (
    <div className='block rounded w-32 h-32 mx-2'>
      <Link to={`/album/${album.id}`} className='h-32'>
        <CoverImage
          reflect
          albumName={album.name}
          cover={{
            thumbnailUrl: album.thumbnailUrl,
            fullUrl: album.thumbnailUrl
          }}
        />
        <p className='py-4 whitespace-normal text-center truncate w-32'>
          { album.name }
        </p>
      </Link>
    </div>
  )
}

// All items component
// Important! add unique key
export const Albums = (list: Array<any>) => {
  return list
    .filter((album) => {
      return album.name !== '' // We don't want empty titles
    })
    .map((album) => {
      return (
        <AlbumCover
          key={album.id}
          album={album}
        />
      )
    })
}

type Props = {
  albums: Array<any>
}

const RelatedAlbums = (props: Props) => {
  const albums = Albums(props.albums)
  const title = <Translate value='titles.albums'/>

  return (
    <HorizontalSlider
      title={title}
      items={albums}
    />
  )
}

export default RelatedAlbums
