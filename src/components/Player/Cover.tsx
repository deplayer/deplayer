import * as React from 'react'

import CoverImage from '../MusicTable/CoverImage'
import Song from '../../entities/Song'

type Props = {
  slim?: boolean,
  song: Song
}

const Cover = (props: Props) => {
  if (props.slim) {
    return null
  }

  return (
    <div className='media-thumb m-1'>
      <CoverImage
        cover={props.song.cover}
        size='thumbnail'
        albumName={props.song.album ? props.song.album.name : 'N/A'}
      />
    </div>
  )
}

export default Cover