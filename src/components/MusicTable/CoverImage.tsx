import * as React from 'react'

import LazyImage from '../LazyImage'

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover: cover,
  size: string,
  onClick?: () => void,
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

const Img = (props: { src?: string, alt?: string, noImage?: boolean, onClick?: () => void}) => {
  return (
    <LazyImage
      src={props.src}
      onClick={props.onClick}
    >
      <Content src={props.src} />
    </LazyImage>
  )
}

const CoverImage = (props: Props) => {
  if (!props.cover) {
    return (
      <Img
        onClick={props.onClick}
        noImage
      />
    )
  }
  const src = props.size === 'full' && props.cover.fullUrl ?
    props.cover.fullUrl : props.cover.thumbnailUrl

  return (
    <Img
      onClick={props.onClick}
      alt={ `${props.albumName} cover` }
      src={ src }
    />
  )
}

export default CoverImage
