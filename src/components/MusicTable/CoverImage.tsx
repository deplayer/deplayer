import LazyImage from '../LazyImage'
import classNames from 'classnames'
import React from 'react'

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover?: cover,
  reflect?: boolean,
  size?: string,
  onClick?: () => void,
  useImage?: boolean,
  albumName: string,
  noFade?: boolean
}

interface ContentProps {
  alt: string,
  src?: string,
  noImage?: boolean,
  reflect?: boolean,
  useImage?: boolean,
  isLoaded?: boolean,
  noFade?: boolean
}

const Content = (props: ContentProps) => {
  const placeholderUrl = '/disc.svg'
  const imageUrl = props.noImage ? placeholderUrl : props.src

  if (props.useImage) {
    return (
      <img
        src={imageUrl}
        alt={props.alt}
        className={classNames(
          "w-full h-full object-cover",
          {
            "transition-opacity duration-300": !props.noFade,
            "opacity-0": !props.noFade && !props.isLoaded && !props.noImage,
            "opacity-100": props.noFade || props.isLoaded || props.noImage
          }
        )}
        draggable={false}
      />
    )
  }

  const className = classNames(
    'cover-image',
    {
      'reflected-image': props.reflect,
      'transition-opacity duration-300': !props.noFade,
      'opacity-0': !props.noFade && !props.isLoaded && !props.noImage,
      'opacity-100': props.noFade || props.isLoaded || props.noImage
    }
  )

  return (
    <div
      data-testid='cover-image'
      className={className}
      style={{ 
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundColor: !imageUrl ? 'rgba(0,0,0,0.1)' : undefined,
        backgroundSize: 'cover'
      }}
      data-alt={props.alt}
    />
  )
}

type ImgProps = {
  src?: string,
  alt?: string,
  noImage?: boolean,
  reflect?: boolean,
  onClick?: () => void,
  useImage?: boolean,
  noFade?: boolean
}

const Img = (props: ImgProps) => {
  return (
    <LazyImage
      src={props.src}
      reflect={props.reflect}
      onClick={props.onClick}
      noFade={props.noFade}
    >
      <Content 
        useImage={props.useImage} 
        src={props.src} 
        alt={props.alt || ''} 
        reflect={props.reflect}
        noFade={props.noFade}
      />
    </LazyImage>
  )
}

const CoverImage = (props: Props) => {
  if (!props.cover) {
    return (
      <Img
        reflect={props.reflect}
        useImage={props.useImage}
        onClick={props.onClick}
        noImage
        noFade={props.noFade}
      />
    )
  }

  const src = props.size === 'full' && props.cover.fullUrl ?
    props.cover.fullUrl : props.cover.thumbnailUrl

  return (
    <Img
      reflect={props.reflect}
      useImage={props.useImage}
      onClick={props.onClick}
      alt={`${props.albumName} cover`}
      src={src}
      noFade={props.noFade}
    />
  )
}

export default React.memo(CoverImage)
