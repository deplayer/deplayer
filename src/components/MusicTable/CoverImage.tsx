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
  useImage?: boolean,
  albumName: string
}

const Content = (props: any) => {
  const placeholderUrl = '/logo.png'
  const imageUrl = props.noImage ? placeholderUrl : props.src

  if (props.useImage) {
    return (
      <img
        src={imageUrl}
        alt={ props.alt }
      />
    )
  }

  return (
    <div
      className='cover-image'
      style={{backgroundImage: `url(${imageUrl})`}}
      data-alt={ props.alt }
    />
  )
}

type ImgProps = {
  src?: string,
  alt?: string,
  noImage?: boolean,
  onClick?: () => void,
  useImage?: boolean
}

const Img = (props: ImgProps) => {
  return (
    <LazyImage
      src={props.src}
      onClick={props.onClick}
    >
      <Content useImage={props.useImage} src={props.src} />
    </LazyImage>
  )
}

const CoverImage = (props: Props) => {
  if (!props.cover) {
    return (
      <Img
        useImage={props.useImage}
        onClick={props.onClick}
        noImage
      />
    )
  }
  const src = props.size === 'full' && props.cover.fullUrl ?
    props.cover.fullUrl : props.cover.thumbnailUrl

  return (
    <Img
      useImage={props.useImage}
      onClick={props.onClick}
      alt={ `${props.albumName} cover` }
      src={ src }
    />
  )
}

export default CoverImage
