import * as React from 'react'

import Artist from '../../entities/Artist'
import { Link } from 'react-router-dom'

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
      <Link to={`/artist/${artist.id}`}>
        <span>
          <i style={{marginRight: '5px'}} className='fa fa-microphone' />
          { artist.name }
        </span>

        <span className='badge badge-secondary'>
          { props.songs.length }
        </span>
      </Link>
    </div>
  )
}

export default ArtistRow
