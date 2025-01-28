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

const Content = React.memo((props: ContentProps) => {
  const placeholderUrl = '/disc.svg'
  const imageUrl = props.noImage ? placeholderUrl : props.src

  if (props.useImage) {
    return (
      <div className="relative w-full h-full">
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
      </div>
    )
  }

  const className = classNames(
    'cover-image relative',
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
}, (prevProps, nextProps) => {
  // Custom comparison function for Content component
  return (
    prevProps.alt === nextProps.alt &&
    prevProps.src === nextProps.src &&
    prevProps.noImage === nextProps.noImage &&
    prevProps.reflect === nextProps.reflect &&
    prevProps.useImage === nextProps.useImage &&
    prevProps.isLoaded === nextProps.isLoaded &&
    prevProps.noFade === nextProps.noFade
  )
})

type ImgProps = {
  src?: string,
  alt?: string,
  noImage?: boolean,
  reflect?: boolean,
  onClick?: () => void,
  useImage?: boolean,
  noFade?: boolean
}

const Img = React.memo((props: ImgProps) => {
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
}, (prevProps, nextProps) => {
  // Custom comparison function for Img component
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.noImage === nextProps.noImage &&
    prevProps.reflect === nextProps.reflect &&
    prevProps.useImage === nextProps.useImage &&
    prevProps.noFade === nextProps.noFade &&
    prevProps.onClick === nextProps.onClick
  )
})

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
