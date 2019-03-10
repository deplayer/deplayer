import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import CoverImage from './CoverImage'
import ContextualMenu from './ContextualMenu'

type Props = {
  song: Song,
  isCurrent: boolean,
  onClick: () => any,
  dispatch: Dispatch,
  disableAddButton?: boolean,
  style: any
}

const SongRow = (props: Props) => {
  const { song } = props

  const nonAvailable = <Translate value='song.row.na' />
  return (
    <li
      className={`song-row ${ props.isCurrent ? 'current': ''}`}
      style={props.style}
    >
      <div className='media-thumb'>
        <CoverImage
          cover={song.cover}
          size='thumbnail'
          albumName={song.album ? song.album.name : 'N/A'}
        />
      </div>
      <ul className='media-info'>
        <li className='title-label'><h4>{ song.title }</h4></li>
        <li><h5>{ song.album ? song.album.name: nonAvailable }</h5></li>
        <li><h6>{ song.artist ? song.artist.name: nonAvailable }</h6></li>
        <li>{ getDurationStr(song.duration) }</li>
      </ul>
      <ContextualMenu {...props} />
    </li>
  )
}

export default SongRow
