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

const Content = (props: any) => {
  const placeholderUrl = '/logo.png'
  const imageUrl = props.noImage ? placeholderUrl : props.src

  return (
    <div
      className='cover-image'
      style={{backgroundImage: `url(${imageUrl})`}}
      data-alt={ props.alt }
    />
  )
}

const Img = (props: { src?: string, alt?: string, noImage?: boolean}) => {
  return (
    <LazyImage
      src={props.src}
    >
      <Content src={props.src} />
    </LazyImage>
  )
}

const CoverImage = (props: Props) => {
  if (!props.cover) {
    return (
      <Img
        noImage
      />
    )
  }
  const src = props.size === 'full' && props.cover.fullUrl ?
    props.cover.fullUrl : props.cover.thumbnailUrl

  return (
    <Img
      alt={ `${props.albumName} cover` }
      src={ src }
    />
  )
}

export default CoverImage
