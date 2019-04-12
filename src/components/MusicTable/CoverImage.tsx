import * as React from 'react'

import LazyImage from '../LazyImage'

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
  const Content = (props: any) => {
    const placeholderUrl = 'logo.png'
    const imageUrl = props.noImage ? placeholderUrl : props.src

    return (
      <div
        className='cover-image'
        style={{backgroundImage: `url(${imageUrl})`}}
        data-alt={ props.alt }
      />
    )
  }

  const Img = (props) => {
    return (
      <LazyImage
        src={props.src}
        srcAlt={props.alt}
      >
        <Content src={props.src} />
      </LazyImage>
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
