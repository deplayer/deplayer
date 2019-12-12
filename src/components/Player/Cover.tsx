import * as React from 'react'

import CoverImage from '../MusicTable/CoverImage'
import Media from '../../entities/Media'

type Props = {
  slim?: boolean,
  song: Media
}

const Cover = (props: Props) => {
  if (props.slim) {
    return null
  }

  return (
    <div className='media-thumb hidden md:block h-full' style={{ width: '60px', height: '60px' }}>
      <CoverImage
        useImage
        cover={props.song.cover}
        size='thumbnail'
        albumName={props.song.album ? props.song.album.name : 'N/A'}
      />
    </div>
  )
}

export default Cover
