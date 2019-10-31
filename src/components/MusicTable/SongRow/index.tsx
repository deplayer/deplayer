import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { getDurationStr } from '../../../utils/timeFormatter'
import ContextualMenu from './../ContextualMenu'
import CoverImage from './../CoverImage'
import Song from '../../../entities/Song'
import Tag from '../../common/Tag'

type Props = {
  song: Song,
  isCurrent: boolean|null,
  onClick: () => any,
  dispatch: Dispatch,
  disableAddButton?: boolean,
  disableCovers?: boolean,
  slim?: boolean,
  style: any
}

const SongRow = (props: Props) => {
  const { song, disableCovers } = props

  const nonAvailable = <Translate value='song.row.na' />

  const onClick = () => {
    if (props.slim) {
      props.onClick()
    }
  }

  const cover = (
    <div
      className='media-thumb'
      onClick={props.onClick}
    >
      <CoverImage
        cover={song.cover}
        size='thumbnail'
        albumName={song.album ? song.album.name : 'N/A'}
      />
    </div>
  )

  return (
    <div
      className={`song-row ${ props.isCurrent ? 'current': ''}`}
      style={props.style}
      onClick={onClick}
    >
      <div>
        { disableCovers || cover }
        <ul className='media-info'>
          <li className='title-label'>
            <h4>
              <Link to={`/song/${song.id}`}>
                { song.title }
              </Link>
              </h4>
            </li>
          <li><h5>{ song.album ? song.album.name: nonAvailable }</h5></li>
          <li>
            <h6>
              <Link to={`/artist/${song.artist.id}`}>{ song.artist ? song.artist.name: nonAvailable }</Link>
            </h6>
          </li>
          { props.slim ||  <li> { getDurationStr(song.duration) } </li> }
        </ul>
        <div>
        {
          props.slim ||
          song.stream.map((provider) => {
            return (<Tag key={provider.service}>{ provider.service }</Tag>)
          })
        }
        </div>
        <div className='media-actions'>
          <ContextualMenu {...props} />
          { props.slim && <span>{ getDurationStr(song.duration) }</span> }
        </div>
      </div>
    </div>
  )
}

export default SongRow
