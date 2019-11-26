import { Link } from 'react-router-dom'
import * as React from 'react'

import Artist from '../../entities/Artist'
import Tag from '../common/Tag'

type Props = {
  artist: Artist,
  songs: any,
  style: any
}

const ArtistRow = (props: Props) => {
  const { artist } = props

  return (
    <div
      className='artist-row w-full'
      style={props.style}
    >
      <Link className='flex justify-between' to={`/artist/${artist.id}`}>
        <span>
          <i style={{marginRight: '5px'}} className='fa fa-microphone' />
          { artist.name }
        </span>

        <Tag>
          { props.songs.length }
        </Tag>
      </Link>
    </div>
  )
}

export default ArtistRow
