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
  mqlMatch: boolean,
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
      className='media-thumb relative mr-3'
      style={{ minWidth: '80px', height: '80px' }}
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
      className={`song-row ${ props.isCurrent ? 'current': ''} p-2 flex justify-between`}
      style={props.style}
      onClick={onClick}
    >
      { disableCovers || cover }
      <ul className='media-info truncate w-full whitespace-no-wrap m-1'>
        <li className='title-label'>
          <h4 className='text-blue-400 text-lg'>
            <Link to={`/song/${song.id}`}>
              { song.title }
            </Link>
          </h4>
        </li>
        <li>
          <h5 className='text-yellow-600'>
            { song.album ? song.album.name: nonAvailable }
          </h5>
        </li>
        <li>
          <h6 className='text-yellow-600'>
            <Link to={`/artist/${song.artist.id}`}>{ song.artist ? song.artist.name: nonAvailable }</Link>
          </h6>
        </li>
        <li>
          { props.slim || (
            <div className='inline-block text-yellow-400'>{ getDurationStr(song.duration) }</div>
          )}
        </li>
      </ul>
      <div className='relative'>
        <ContextualMenu {...props} />
        <div>
          {
            !props.slim && props.mqlMatch &&
              song.stream.map((provider) => {
                return (<Tag key={provider.service}>{ provider.service }</Tag>)
              })
          }
          { props.slim && (
              <span className='text-yellow-400'>{ getDurationStr(song.duration) }</span>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default SongRow
