import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import { getDurationStr } from '../../../utils/timeFormatter'
import CoverImage from './../CoverImage'
import type { MediaRow, Cover } from '../../../types/media'
import Tag from '../../common/Tag'
import ServiceIcon from '../../ServiceIcon'
import Icon from '../../common/Icon'
import type { QueueState } from '../../../stores/livestore/queue'

const ContextualMenu = React.lazy(() => import('./../ContextualMenu'))

// Lightweight trigger that only mounts the heavy ContextualMenu on demand
const LazyContextualMenuTrigger = (props: Props) => {
  const [opened, setOpened] = React.useState(false)

  if (!opened) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpened(true) }}
        aria-label="Open context menu"
        className='cursor-pointer p-2 menu-trigger focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded bg-transparent'
      >
        <Icon icon='faEllipsisV' className='text-blue-400' />
      </button>
    )
  }

  return (
    <React.Suspense fallback={<span>⋮</span>}>
      <ContextualMenu {...props} />
    </React.Suspense>
  )
}
import FavoriteButton from '../../common/FavoriteButton'

export type Props = {
  song: MediaRow,
  queue?: QueueState,
  isCurrent?: boolean | null,
  onClick: () => void,
  dispatch: Dispatch,
  disableAddButton?: boolean,
  disableCovers?: boolean,
  mqlMatch?: boolean,
  slim?: boolean,
  style: React.CSSProperties,
  favoriteIds?: Set<string>,
}

const SongCover = React.memo(({ cover, onClick, albumName }: { cover: Cover, onClick: () => void, albumName: string }) => {
  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && handleRowClick) handleRowClick(e as unknown as React.MouseEvent) }}
      className='media-thumb relative mr-3 overflow-hidden'
      style={{ minWidth: '80px', height: '80px' }}
      onClick={handleRowClick}
      data-testid="song-cover"
    >
      <CoverImage
        cover={cover}
        size='thumbnail'
        albumName={albumName}
      />
    </div>
  )
})  

const ProviderTags = ({ song }: { song: MediaRow }) => {
  return (
    <div className='flex items-center min-w-fit'>
      {Object.values(song.stream).map((provider) => {
        return <Tag transparent key={provider.service}><ServiceIcon service={provider.service} /><p className='capitalize'>{provider.service}</p></Tag>
      })}
    </div>
  )
}

const SongRow = React.memo((props: Props) => {
  const { song, disableCovers, slim, mqlMatch } = props

  // Validate song data
  if (!song || !song.id) {
    return null
  }

  const nonAvailable = <Translate value='song.row.na' />

  const onClick = () => {
    props.onClick()
  }

  const shouldShowCover = !disableCovers && !slim && song.cover && mqlMatch

  return (
    <div role="button" tabIndex={0} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onClick) onClick() }}
      data-testid="song-row"
      className={`song-row p-2 flex justify-between ${props.isCurrent ? 'bg-base-200' : ''} hover:bg-base-200/50`}
      style={props.style}
      onClick={onClick}
    >
      {shouldShowCover && song.cover && (
        <SongCover 
          cover={song.cover} 
          onClick={onClick} 
          albumName={song.albumName || 'N/A'}
        />
      )}
      <div className='media-info truncate w-full whitespace-no-wrap'>
        <div className='text-lg -mt-1'>
          <Link to={`/song/${song.id}`} className="text-base-content hover:text-primary">
            {song.track && <span className='mr-1 text-primary text-xl font-bold inline-block'>{song.track}</span>}
            {song.title || nonAvailable}
          </Link>
        </div>
        <div className='text-base-content/70 text-sm'>
          {song.albumName || nonAvailable}
        </div>
        <div className='text-sm'>
          <Link to={`/artist/${song.artistId || ''}`} className="text-base-content/70 hover:text-primary">
            {song.artistName || nonAvailable}
          </Link>
        </div>
        {props.slim && (
          <div className='inline-block text-base-content/60 text-sm'>{getDurationStr(song.duration || 0)}</div>
        )}
      </div>
      <div className='flex items-center min-w-fit' tabIndex={0}>
        <FavoriteButton songId={song.id} className="mr-2" favoriteIds={props.favoriteIds} />
        <div className='mx-4'>
          { !props.slim && song.stream && <ProviderTags song={song} /> }
          {props.slim && (
            <span className='text-primary'>{getDurationStr(song.duration || 0)}</span>
          )}
        </div>
        <div className='relative'>
          <LazyContextualMenuTrigger {...props} />
        </div>
      </div>
    </div>
  )
})

SongRow.displayName = 'SongRow'

export default SongRow
