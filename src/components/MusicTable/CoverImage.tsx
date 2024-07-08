import LazyImage from '../LazyImage'
import classNames from 'classnames'

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover: cover,
  reflect?: boolean,
  size?: string,
  onClick?: () => void,
  useImage?: boolean,
  albumName: string
}

const Content = (props: any) => {
  const placeholderUrl = '/disc.svg'
  const imageUrl = props.noImage ? placeholderUrl : props.src

  if (props.useImage) {
    return (
      <img
        src={imageUrl}
        alt={props.alt}
      />
    )
  }

  const className = classNames({
    'cover-image': true,
    "reflected-image": props.reflect,
  })

  return (
    <div
      data-testid='cover-image'
      className={className}
      style={{ backgroundImage: `url(${imageUrl})` }}
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
  useImage?: boolean
}

const Img = (props: ImgProps) => {
  return (
    <LazyImage
      src={props.src}
      reflect={props.reflect}
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
        reflect={props.reflect}
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
      reflect={props.reflect}
      useImage={props.useImage}
      onClick={props.onClick}
      alt={`${props.albumName} cover`}
      src={src}
    />
  )
}

export default CoverImage
