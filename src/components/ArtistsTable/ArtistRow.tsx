import * as React from 'react'

import Artist from '../../entities/Artist'

type Props = {
  artist: Artist,
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
      </div>
    </li>
  )
}

export default ArtistRow
