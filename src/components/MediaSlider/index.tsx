import { Link } from 'react-router-dom'
import React from 'react'

import CoverImage from '../MusicTable/CoverImage'
import HorizontalSlider from '../HorizontalSlider'
import Spinner from '../Spinner'
import Tag from '../common/Tag'
import BodyMessage from '../BodyMessage'
import { Translate } from 'react-redux-i18n'

const MediaCover = ({ media }) => {
  return (
    <div className='block rounded w-32 h-32 mx-2'>
      <Link to={`/song/${media.id}`} className='h-32'>
        <Tag transparent fullWidth>{ media.playCount ? `${media.playCount} times played` : "never played" }</Tag>
        <CoverImage
          reflect
          albumName={media.title}
          cover={{
            thumbnailUrl: media.cover.thumbnailUrl,
            fullUrl: media.cover.thumbnailUrl
          }}
        />
        <div className='py-4 whitespace-normal text-center truncate w-32'>
          { media.title }
        </div>
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
    return (
      <BodyMessage message={
        <div>
          <Translate value='message.noMostPlayed' />
          <br/>
          <Link to={'/collection'} className='h-32 button'><Translate value='message.goToCollection' /></Link>
        </div>
      }/>
    )
  }

  return (
    <HorizontalSlider
      title={props.title}
      items={mediaItems}
    />
  )
}

export default SongsSlider
