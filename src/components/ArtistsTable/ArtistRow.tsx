import { Link } from 'react-router-dom'
import * as React from 'react'

import Artist from '../../entities/Artist'
import Tag from '../common/Tag'
import Icon from '../common/Icon'

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
      <Link className='flex justify-between items-center' to={`/artist/${artist.id}`}>
        <Icon icon='faMicrophoneAlt' />
        <span className='ml-4 w-full truncate'>
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
