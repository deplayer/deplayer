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
      className='media-thumb hidden md:block relative mr-3'
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
      className={`song-row ${ props.isCurrent && 'current' } p-2 flex justify-between`}
      style={props.style}
      onClick={onClick}
    >
      { disableCovers || cover }
      <div className='media-info truncate w-full whitespace-no-wrap'>
        <h4 className='text-blue-400 text-lg -mt-1'>
          <Link to={`/song/${song.id}`}>
            { song.title }
          </Link>
        </h4>
        <h5 className='text-yellow-600 text-sm'>
          { song.album ? song.album.name: nonAvailable }
        </h5>
        <h6 className='text-yellow-600 text-sm'>
          <Link to={`/artist/${song.artist.id}`}>{ song.artist ? song.artist.name: nonAvailable }</Link>
        </h6>
        { props.slim || (
          <div className='inline-block text-yellow-400 text-sm'>{ getDurationStr(song.duration) }</div>
        )}
      </div>
      <div className='relative'>
        <ContextualMenu {...props} />
        <div>
          {
            !props.slim && props.mqlMatch &&
              song.stream.map((provider) => {
                return (<Tag transparent key={provider.service}>{ provider.service }</Tag>)
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
