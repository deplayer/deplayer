import React from 'react'
import HorizontalSlider from '../HorizontalSlider'
import Spinner from '../Spinner'
import MediaCover from '../common/AlbumCover'
import type { MediaRow } from '../../types/media'

type MediaCoverProps = {
  media: MediaRow,
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
      artistName={media.artistName || 'Unknown Artist'}
      cover={media.cover}
      playCount={media.playCount}
      showPlayCount
      type="song"
    />
  )
}

// All items component
// Important! add unique key
const MediaItems = (list: Array<MediaRow>) => {
  return list.flatMap((media) => {
    if (!media || !media.id) return []
    return [
      <MediaCoverWrapper
        itemId={media.id}
        key={media.id}
        media={media}
      />
    ]
  })
}

type Props = {
  mediaItems: Array<MediaRow>,
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
