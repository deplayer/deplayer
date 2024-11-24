import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import { getDurationStr } from '../../../utils/timeFormatter'
import ContextualMenu from './../ContextualMenu'
import CoverImage from './../CoverImage'
import Media from '../../../entities/Media'
import Tag from '../../common/Tag'
import ServiceIcon from '../../ServiceIcon'
import { State as QueueState } from '../../../reducers/queue'

export type Props = {
  songsLength: number, // Listening this in order to recreate context menu
  song: Media,
  queue?: QueueState,
  isCurrent?: boolean | null,
  onClick: () => void,
  dispatch: Dispatch,
  disableAddButton?: boolean,
  disableCovers?: boolean,
  mqlMatch?: boolean,
  slim?: boolean,
  style: React.CSSProperties
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
      role='row'
      className='media-thumb hidden md:block relative mr-3'
      style={{ minWidth: '80px', height: '80px' }}
      onClick={props.onClick}
      tabIndex={0}
    >
      <CoverImage
        cover={song.cover}
        size='thumbnail'
        albumName={song.albumName || song.album ? song.album.name : 'N/A'}
      />
    </div>
  )

  return (
    <div
      className={`song-row ${props.isCurrent && 'current'} p-2 flex justify-between`}
      style={props.style}
      onClick={onClick}
    >
      {disableCovers || cover}
      <div className='media-info truncate w-full whitespace-no-wrap'>
        <h4 className='text-sky-900 dark:text-sky-400 text-lg -mt-1'>
          <Link to={`/song/${song.id}`}>
            {song.track && <span className='mr-1 text-yellow-900 dark:text-yellow-500 hover:dark:text-yellow-200 text-xl font-bold inline-block'>{song.track}</span>}
            {song.title}
          </Link>
        </h4>
        <h5 className='text-yellow-900 dark:text-yellow-600 text-sm'>
          {song.album ? song.album.name : nonAvailable}
        </h5>
        <h6 className='text-yellow-900 dark:text-yellow-600 text-sm'>
          <Link to={`/artist/${song.artist.id}`}>{song.artist ? song.artist.name : nonAvailable}</Link>
        </h6>
        {props.slim || (
          <div className='inline-block text-yellow-900 dark:text-yellow-400 text-sm'>{getDurationStr(song.duration)}</div>
        )}
      </div>
      <div className='flex' tabIndex={0}>
        <div className='mx-4'>
          {
            !props.slim && props.mqlMatch &&
            Object.values(song.stream).map((provider) => {
              return <Tag transparent key={provider.service}><ServiceIcon service={provider.service} /><p className='capitalize'>{provider.service}</p></Tag>
            })
          }
          {props.slim && (
            <span className='text-yellow-400'>{getDurationStr(song.duration)}</span>
          )}
        </div>
        <div className='h-10'>
          <ContextualMenu {...props} />
        </div>
      </div>
    </div >
  )
}

export default SongRow
