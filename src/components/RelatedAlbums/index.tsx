import { Translate } from 'react-redux-i18n'
import React from 'react'
import ScrollMenu from 'react-horizontal-scrolling-menu'

import CoverImage from '../MusicTable/CoverImage'

const AlbumCover = ({ album, selected }) => {
  return (
    <div className='border rounded w-32 h-32 mx-2'>
      <CoverImage
        albumName={album.name}
        cover={{
          thumbnailUrl: album.thumbnailUrl,
          fullUrl: album.thumbnailUrl
        }}
      />
      <p className='py-4 whitespace-normal text-center truncate w-32'>
        { album.name }
      </p>
    </div>
  ) }

// All items component
// Important! add unique key
export const Albums = (list: Array<any>, selected: any) => {
  return list.map((album) => {
    return (
      <AlbumCover
        key={album.id}
        album={album}
        selected={selected}
      />
    )
  })
}

const Arrow = ({ text, className }) => {
  return (
    <div
      className={className}
    >
     {text}
    </div>
  )
}


const ArrowLeft = Arrow({ text: '<', className: 'arrow-prev pr-4' });
const ArrowRight = Arrow({ text: '>', className: 'arrow-next pl-4' });

type Props = {
  albums: Array<any>
}

const RelatedAlbums = (props: Props) => {
  const albums = Albums(props.albums, false)

  return (
    <div className='w-full mt-8 overflow-hidden'>
      <h2 className='my-4 text-xl'><Translate value='titles.relatedAlbums'/></h2>
      <ScrollMenu
        alignCenter={false}
        data={albums}
        arrowLeft={ArrowLeft}
        arrowRight={ArrowRight}
      />
    </div>
  )
}

export default RelatedAlbums
