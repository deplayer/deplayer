import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import { getDurationStr } from '../../../utils/timeFormatter'
import ContextualMenu from './../ContextualMenu'
import CoverImage from './../CoverImage'
import Media, { Cover } from '../../../entities/Media'
import Tag from '../../common/Tag'
import ServiceIcon from '../../ServiceIcon'
import { State as QueueState } from '../../../reducers/queue'
import FavoriteButton from '../../common/FavoriteButton'

export type Props = {
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

const SongCover = React.memo(({ cover, onClick, albumName }: { cover: Cover, onClick: () => void, albumName: string }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      role='row'
      className='media-thumb relative mr-3 overflow-hidden'
      style={{ minWidth: '80px', height: '80px' }}
      onClick={handleClick}
      tabIndex={0}
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

const ProviderTags = ({ song }: { song: Media }) => {
  return (
    <div className='flex items-center min-w-fit'>
      {Object.values(song.stream).map((provider) => {
        return <Tag transparent key={provider.service}><ServiceIcon service={provider.service} /><p className='capitalize'>{provider.service}</p></Tag>
      })}
    </div>
  )
}

const SongRow = (props: Props) => {
  const { song, disableCovers, slim, mqlMatch } = props
  
  // 🔍 DEBUG: Track SongRow render
  const renderCountRef = React.useRef(0)
  renderCountRef.current += 1
  
  React.useEffect(() => {
    if (renderCountRef.current === 1) {
      console.log(`[SongRow] 🎵 First render: ${song.id} - ${song.title}`)
    }
  }, [])

  // Validate song data
  if (!song || !song.id) {
    console.warn('SongRow: Invalid song data received')
    return null
  }

  // Add debug logging
  React.useEffect(() => {
    if (!song.title || !song.artist || !song.album) {
      console.warn('SongRow: Incomplete song data detected:', {
        id: song.id,
        title: song.title,
        artist: song?.artist?.name,
        album: song?.album?.name,
        hasStream: !!song.stream,
        hasCovers: !!song.cover
      })
    }
  }, [song])

  const nonAvailable = <Translate value='song.row.na' />

  const onClick = () => {
    props.onClick()
  }

  const shouldShowCover = !disableCovers && !slim && song.cover && mqlMatch

  return (
    <div
      data-testid="song-row"
      className={`song-row p-2 flex justify-between ${props.isCurrent ? 'bg-base-200' : ''} hover:bg-base-200/50`}
      style={props.style}
      onClick={onClick}
    >
      {shouldShowCover && song.cover && (
        <SongCover 
          cover={song.cover} 
          onClick={onClick} 
          albumName={song.albumName || (song.album && song.album.name) || 'N/A'} 
        />
      )}
      <div className='media-info truncate w-full whitespace-no-wrap'>
        <h4 className='text-lg -mt-1'>
          <Link to={`/song/${song.id}`} className="text-base-content hover:text-primary">
            {song.track && <span className='mr-1 text-primary text-xl font-bold inline-block'>{song.track}</span>}
            {song.title || nonAvailable}
          </Link>
        </h4>
        <h5 className='text-base-content/70 text-sm'>
          {(song.album && song.album.name) || nonAvailable}
        </h5>
        <h6 className='text-sm'>
          <Link to={`/artist/${song.artist?.id || ''}`} className="text-base-content/70 hover:text-primary">
            {(song.artist && song.artist.name) || nonAvailable}
          </Link>
        </h6>
        {props.slim && (
          <div className='inline-block text-base-content/60 text-sm'>{getDurationStr(song.duration || 0)}</div>
        )}
      </div>
      <div className='flex items-center min-w-fit' tabIndex={0}>
        <FavoriteButton songId={song.id} className="mr-2" />
        <div className='mx-4'>
          { !props.slim && song.stream && <ProviderTags song={song} /> }
          {props.slim && (
            <span className='text-primary'>{getDurationStr(song.duration || 0)}</span>
          )}
        </div>
        <div className='relative'>
          <ContextualMenu {...props} />
        </div>
      </div>
    </div>
  )
}

export default SongRow
