import * as React from 'react'

import Artist from '../../entities/Artist'

type Props = {
  artist: Artist,
  songs: any,
  style: any
}

const ArtistRow = (props: Props) => {
  const { artist } = props

  return (
    <li
      className='song-row'
      style={props.style}
    >
      <div>
        { artist.name }

        <span className='badge'>
          { props.songs.length }
        </span>
      </div>
    </li>
  )
}

export default ArtistRow
