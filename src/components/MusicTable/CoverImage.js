// @flow

import React from 'react'

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover: cover,
  size: string,
  albumName: string
}

const CoverImage = (props: Props) => {

  const Img = (props) => {
    return (
      <div
        className='cover-image'
        style={{backgroundImage: `url(${props.src})`}}
        data-alt={ props.alt }
      />
    )
  }

  if (props.size === 'thumbnail' && props.cover && props.cover.thumbnailUrl) {
    return (
      <Img
        alt={ `${props.albumName} cover` }
        src={ props.cover.thumbnailUrl }
      />
    )
  }

  if (props.size === 'full' && props.cover && props.cover.fullUrl) {
    return (
      <Img
        alt={ `${props.albumName} cover` }
        src={ props.cover.fullUrl }
      />
    )
  }

  return (
    <i
      className='cover-image fa fa-music'
    />
  )
}

export default CoverImage
