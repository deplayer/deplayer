import { Link } from 'react-router-dom'
import React from 'react'

import CoverImage from '../MusicTable/CoverImage'
import HorizontalSlider from '../HorizontalSlider'
import Spinner from '../Spinner'
import Tag from '../common/Tag'
import type Media from '../../entities/Media'

const MediaCover = ({ media }: { media: Media, itemId: string }) => {
  if (!media.cover) {
    return null
  }

  return (
    <div className='flex items-start rounded justify-center w-32 h-60 mx-4'>
      <Link to={`/song/${media.id}`} className='flex flex-col items-start justify-center'>
        <div className='absolute top-0 z-10'>
          <Tag fullWidth><span className=''>{media.playCount ? `#${media.playCount} times played` : "never played"}</span></Tag>
        </div>
        <div className='h-32 w-32'>
          <CoverImage
            reflect
            albumName={media.title}
            useImage
            cover={{
              thumbnailUrl: media.cover.thumbnailUrl,
              fullUrl: media.cover.thumbnailUrl
            }}
          />
        </div>
        <p className='py-4 whitespace-normal text-center truncate inline w-full'>
          {media.title}
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
        itemId={media.id}
        key={media.id}
        media={media}
      />
    )
  })
}

type Props = {
  mediaItems: Array<any>,
  loading?: boolean,
  title: React.ReactNode
}

const SongsSlider = (props: Props) => {
  const mediaItems = MediaItems(props.mediaItems)

  if (props.loading) {
    return (
      <Spinner />
    )
  }

  if (!mediaItems.length) {
    return null
  }

  return (
    <HorizontalSlider
      title={props.title}
      items={mediaItems}
    />
  )
}

export default SongsSlider
