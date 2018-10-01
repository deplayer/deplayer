// @flow

import React from 'react'
import Song from '../../entities/Song'

type Props = {
  song: Song
}

const CoverImage = (props: Props) => {
  if (props.song.cover && props.song.cover.thumbnailUrl) {
    return (
      <img
        alt={ `${props.song.album.name} cover` }
        src={ props.song.cover.thumbnailUrl }
      />
    )
  }

  return (
    <img
      alt='Placeholder cover'
      src='https://via.placeholder.com/70x70'
    />
  )
}

export default CoverImage
