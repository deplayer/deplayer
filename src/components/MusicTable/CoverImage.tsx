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

class CoverImage extends React.Component<Props> {
  // Update component only if the src has changed
  shouldComponentUpdate(nextProps) {
    if (nextProps.cover !== this.props.cover) {
      return true
    }

    return false
  }

  render() {
    if (this.props.size === 'thumbnail' && this.props.cover && this.props.cover.thumbnailUrl) {
      return (
        <Img
          alt={ `${this.props.albumName} cover` }
          src={ this.props.cover.thumbnailUrl }
        />
      )
    }

    if (this.props.size === 'full' && this.props.cover && this.props.cover.fullUrl) {
      return (
        <Img
          alt={ `${this.props.albumName} cover` }
          src={ this.props.cover.fullUrl }
        />
      )
    }

    return (
      <i
        className='cover-image fa fa-music'
      />
    )
  }
}

export default CoverImage
