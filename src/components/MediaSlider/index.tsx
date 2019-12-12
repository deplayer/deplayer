import { Link } from 'react-router-dom'
import React from 'react'

import CoverImage from '../MusicTable/CoverImage'
import HorizontalSlider from '../HorizontalSlider'
import Tag from '../common/Tag'

const MediaCover = ({ media }) => {
  return (
    <div className='block border rounded w-32 h-32 mx-2'>
      <Link to={`/song/${media.id}`} className='h-32'>
        <CoverImage
          albumName={media.title}
          cover={{
            thumbnailUrl: media.cover.thumbnailUrl,
            fullUrl: media.cover.thumbnailUrl
          }}
        />
        <p className='py-4 whitespace-normal text-center truncate w-32'>
          <Tag>{ media.playCount } times played</Tag>
          { media.title }
        </p>
      </Link>
    </div>
  )
}

// All items component
// Important! add unique key
export const MediaItems = (list: Array<any>) => {
  return list.map((media) => {
    return (
      <MediaCover
        key={media.id}
        media={media}
      />
    )
  })
}

type Props = {
  mediaItems: Array<any>,
  title: React.ReactNode
}

const SongsSlider = (props: Props) => {
  const mediaItems = MediaItems(props.mediaItems)
  return (
    <HorizontalSlider
      title={props.title}
      items={mediaItems}
    />
  )
}

export default SongsSlider
