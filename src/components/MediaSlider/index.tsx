import React from 'react'
import HorizontalSlider from '../HorizontalSlider'
import Spinner from '../Spinner'
import MediaCover from '../common/AlbumCover'
import type Media from '../../entities/Media'

type MediaCoverProps = {
  media: Media,
  itemId: string
}

const MediaCoverWrapper = ({ media }: MediaCoverProps) => {
  if (!media?.cover) {
    return null
  }

  return (
    <MediaCover
      id={media.id}
      name={media.title}
      artistName={media.artist?.name || 'Unknown Artist'}
      cover={media.cover}
      playCount={media.playCount}
      showPlayCount
      type="song"
    />
  )
}

// All items component
// Important! add unique key
const MediaItems = (list: Array<any>) => {
  return list
    .filter((media) => media && media.id) // Filter out null/undefined items
    .map((media) => {
      return (
        <MediaCoverWrapper
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
