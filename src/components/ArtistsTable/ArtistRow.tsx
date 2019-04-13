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
    <div
      className='artist-row'
      style={props.style}
    >
      <div>
        { artist.name }

        <span className='badge badge-secondary'>
          { props.songs.length }
        </span>
      </div>
    </div>
  )
}

export default ArtistRow
