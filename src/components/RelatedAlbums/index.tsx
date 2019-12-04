import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import React from 'react'
import ScrollMenu from 'react-horizontal-scrolling-menu'

import Button from '../common/Button'
import CoverImage from '../MusicTable/CoverImage'
import Icon from '../common/Icon'

const AlbumCover = ({ album }) => {
  return (
    <div className='block border rounded w-32 h-32 mx-2'>
      <Link to={`/album/${album.id}`} className='h-32'>
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
      </Link>
    </div>
  )
}

// All items component
// Important! add unique key
export const Albums = (list: Array<any>) => {
  return list.map((album) => {
    return (
      <AlbumCover
        key={album.id}
        album={album}
      />
    )
  })
}

const ArrowLeft = (
  <div
    className='text-5xl h-full z-10 absolute inset-y-0 flex left-0'
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
  >
    <Button transparent>
      <Icon icon='faArrowLeft' className='arrow-prev text-blue-400' />
    </Button>
  </div>
)

const ArrowRight = (
  <div
    className='text-5xl h-full z-10 absolute inset-y-0 flex right-0'
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
  >
    <Button transparent>
      <Icon icon='faArrowRight' className='arrow-prev text-blue-400' />
    </Button>
  </div>
)

type Props = {
  albums: Array<any>
}

const RelatedAlbums = (props: Props) => {
  const albums = Albums(props.albums)

  return (
    <div className='w-full mt-8 overflow-hidden'>
      <h2 className='my-4 text-xl'><Translate value='titles.relatedAlbums'/></h2>
      <ScrollMenu
        menuClass='relative'
        wrapperStyle={{overflow: 'hidden'}}
        hideArrows
        hideSingleArrow
        alignCenter={false}
        data={albums}
        arrowLeft={ArrowLeft}
        arrowRight={ArrowRight}
      />
    </div>
  )
}

export default RelatedAlbums
