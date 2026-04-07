import classNames from 'classnames'
import React from 'react'
import { useCoverImage } from '../../hooks/useCoverImage'

type Cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover?: Cover,
  reflect?: boolean,
  size?: string,
  onClick?: () => void,
  useImage?: boolean,
  albumName: string,
  noFade?: boolean
}

const CoverImage = ({ cover, reflect, size, onClick, useImage, albumName, noFade }: Props) => {
  const rawUrl = cover
    ? (size === 'full' && cover.fullUrl ? cover.fullUrl : cover.thumbnailUrl)
    : undefined

  const objectUrl = useCoverImage(rawUrl)
  const displayUrl = objectUrl || '/disc.svg'

  if (useImage) {
    return (
      <div className="lazy-image w-full bg-no-repeat bg-center cursor-pointer" onClick={onClick}>
        <div className="relative w-full h-full">
          <img
            src={displayUrl}
            alt={`${albumName} cover`}
            className={classNames(
              "w-full h-full object-cover",
              {
                "transition-opacity duration-300": !noFade,
                "opacity-0": !noFade && !objectUrl,
                "opacity-100": noFade || !!objectUrl,
              }
            )}
            draggable={false}
          />
        </div>
      </div>
    )
  }

  const className = classNames(
    'cover-image relative',
    'lazy-image w-full bg-no-repeat bg-center cursor-pointer',
    {
      'reflected-image': reflect,
      'transition-opacity duration-300': !noFade,
      'opacity-100': noFade || !!objectUrl,
    }
  )

  return (
    <div
      data-testid='cover-image'
      className={className}
      onClick={onClick}
      style={{
        backgroundImage: `url(${displayUrl})`,
        backgroundSize: 'cover',
      }}
      data-alt={`${albumName} cover`}
    />
  )
}

export default React.memo(CoverImage)
