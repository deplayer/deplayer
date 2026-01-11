import { useState, useCallback, useMemo, memo } from 'react'
import { Translate } from 'react-redux-i18n'
import { AutoSizer, List } from 'react-virtualized'
import Icon from '../common/Icon'
import Button from '../common/Button'
import Modal from '../common/Modal'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'
import { IMedia } from '../../entities/Media'
import { applyFilters } from '../../utils/apply-filters'
import { useNavigate } from 'react-router-dom'
import { Dispatch } from 'redux'
import { useMediaMap } from '../../stores/livestore/hooks'
import { useStore } from '@livestore/react'
import { playAllAction, addToQueueAction } from '../../stores/livestore/actions'

type Props = {
  playlist: {
    _id: string
    trackIds: Array<string>
    filters?: Record<string, string[]>
    id?: string
    name?: string
  }
  dispatch: Dispatch
}

const Playlist = memo(({ playlist, dispatch }: Props) => {
  const [showSongs, setShowSongs] = useState(false)
  const navigate = useNavigate()
  const isSmartPlaylist = 'filters' in playlist
  
  // Get all media from LiveStore
  const mediaMap = useMediaMap()
  const { store: liveStore } = useStore()

  const handlePlayAll = useCallback(async () => {
    if (!liveStore) return
    
    try {
      let trackIds: string[] = []
      
      if (isSmartPlaylist) {
        trackIds = applyFilters(mediaMap, {
          genres: playlist.filters?.genres || [],
          types: playlist.filters?.types || [],
          artists: playlist.filters?.artists || [],
          providers: playlist.filters?.providers || [],
          favorites: Boolean(playlist.filters?.favorites?.[0] === 'true')
        })
      } else {
        trackIds = playlist.trackIds
      }
      
      if (trackIds.length === 0) return
      
      const firstTrackId = await playAllAction(liveStore, trackIds)
      
      if (firstTrackId) {
        dispatch({ 
          type: types.PLAY_ALL_COMPLETED,
          trackId: firstTrackId 
        })
      }
    } catch (error) {
      console.error('Failed to play playlist:', error)
    }
  }, [liveStore, isSmartPlaylist, playlist, mediaMap, dispatch])

  const handleAddToQueue = useCallback(async () => {
    if (!liveStore) return
    
    try {
      let trackIds: string[] = []
      
      if (isSmartPlaylist) {
        trackIds = applyFilters(mediaMap, {
          genres: playlist.filters?.genres || [],
          types: playlist.filters?.types || [],
          artists: playlist.filters?.artists || [],
          providers: playlist.filters?.providers || [],
          favorites: Boolean(playlist.filters?.favorites?.[0] === 'true')
        })
      } else {
        trackIds = playlist.trackIds
      }
      
      if (trackIds.length === 0) return
      
      await addToQueueAction(liveStore, trackIds)
    } catch (error) {
      console.error('Failed to add playlist to queue:', error)
    }
  }, [liveStore, isSmartPlaylist, playlist, mediaMap])

  const handleApplyFilters = useCallback(() => {
    dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
    Object.entries(playlist.filters || {}).forEach(([filterType, values]) => {
      if (values.length) {
        dispatch({
          type: types.SET_COLLECTION_FILTER,
          filterType,
          values
        })
      }
    })
    navigate('/collection')
  }, [playlist.filters, dispatch, navigate])

  const handleDeletePlaylist = useCallback(() => {
    dispatch({
      type: types.DELETE_SMART_PLAYLIST,
      id: playlist.id
    })
  }, [playlist.id, dispatch])

  const tracksWithCovers = useMemo(() => {
    const tracks = playlist.trackIds.map(id => mediaMap[id])
    const uniqueAlbumTracks = new Map()
    
    tracks.forEach(track => {
      if (!track?.cover?.thumbnailUrl) return
      if (!track.album?.id) return
      
      if (!uniqueAlbumTracks.has(track.album.id)) {
        uniqueAlbumTracks.set(track.album.id, track)
      }
    })

    return Array.from(uniqueAlbumTracks.values()).slice(0, 4)
  }, [playlist.trackIds, mediaMap])

  const totalDuration = useMemo(() => 
    playlist.trackIds.reduce((acc, id) => {
      const track = mediaMap[id] as IMedia
      return acc + (track?.duration || 0)
    }, 0)
  , [playlist.trackIds, mediaMap])

  const songIds = useMemo(() => 
    isSmartPlaylist 
      ? applyFilters(mediaMap, {
          genres: playlist.filters?.genres || [],
          types: playlist.filters?.types || [],
          artists: playlist.filters?.artists || [],
          providers: playlist.filters?.providers || [],
          favorites: Boolean(playlist.filters?.favorites?.[0] === 'true')
        })
      : playlist.trackIds
  , [isSmartPlaylist, playlist, mediaMap])

  const uniqueAlbumCount = useMemo(() => 
    new Set(
      playlist.trackIds
        .map(id => mediaMap[id]?.album?.id)
        .filter(Boolean)
    ).size
  , [playlist.trackIds, mediaMap])

  const rowRenderer = useCallback(({ key, index, style }: { key: string, index: number, style: React.CSSProperties }) => {
    const songId = songIds[index]
    const song = mediaMap[songId]
    if (!song) return null

    return (
      <SongRow
        key={key}
        mqlMatch={false}
        disableCovers
        style={style}
        dispatch={dispatch}
        isCurrent={false}
        slim={true}
        onClick={() => {
          dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
        }}
        song={song}
      />
    )
  }, [songIds, mediaMap, dispatch])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const PlaylistCard = useMemo(() => ({ style }: { style?: React.CSSProperties }) => (
    <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow duration-200" style={style}>
      <figure className="relative aspect-square w-full overflow-hidden bg-base-300">
        {tracksWithCovers.length > 0 ? (
          <div className="grid grid-cols-2 w-full h-full">
            {tracksWithCovers.map((track: IMedia, index: number) => (
              <div key={track.id} className="relative w-full h-full overflow-hidden">
                <img 
                  src={track.cover?.thumbnailUrl} 
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                {index === 3 && uniqueAlbumCount > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-white text-lg font-bold">+{uniqueAlbumCount - 4}</span>
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - tracksWithCovers.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-base-300 flex items-center justify-center">
                <Icon icon="faMusic" className="text-4xl text-base-content/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="faMusic" className="text-4xl text-base-content/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </figure>
      
      <div className="card-body p-4">
        <h3 className="card-title text-lg font-bold truncate">
          {playlist.name || (playlist.filters?.genres?.[0] || 'Untitled Playlist')}
        </h3>
        
        <div className="text-sm opacity-70 space-y-1">
          <div className="flex items-center gap-2">
            <Icon icon="faMusic" className="text-xs" />
            <span>{playlist.trackIds.length} <Translate value="menu.songs" /></span>
          </div>
          {uniqueAlbumCount > 0 && (
            <div className="flex items-center gap-2">
              <Icon icon="faCompactDisc" className="text-xs" />
              <span>{uniqueAlbumCount} <Translate value="titles.albums" /></span>
            </div>
          )}
          {totalDuration > 0 && (
            <div className="flex items-center gap-2">
              <Icon icon="faStopwatch" className="text-xs" />
              <span>{formatDuration(totalDuration)}</span>
            </div>
          )}
        </div>

        <div className="card-actions flex-wrap justify-end mt-4 gap-2">
          <div className="flex w-full gap-2">
            <Button
              onClick={handlePlayAll}
              className="flex-1 bg-primary hover:bg-primary-focus"
            >
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="buttons.playAll" />
            </Button>

            <div className="dropdown dropdown-end">
              <Button className="btn-ghost px-3">
                <Icon icon="faEllipsisV" />
              </Button>
              <ul className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52">
                <li>
                  <button onClick={() => setShowSongs(true)}>
                    <Icon icon="faList" className="mr-2" />
                    <Translate value="buttons.showSongs" />
                  </button>
                </li>
                <li>
                  <button onClick={handleAddToQueue}>
                    <Icon icon="faPlus" className="mr-2" />
                    <Translate value="buttons.addToQueue" />
                  </button>
                </li>
                {isSmartPlaylist && (
                  <>
                    <li>
                      <button onClick={handleApplyFilters}>
                        <Icon icon="faFilter" className="mr-2" />
                        <Translate value="buttons.applyFilters" />
                      </button>
                    </li>
                    <li className="text-error">
                      <button onClick={handleDeletePlaylist}>
                        <Icon icon="faTrash" className="mr-2" />
                        <Translate value="buttons.delete" />
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [playlist.name, tracksWithCovers, uniqueAlbumCount, totalDuration, handlePlayAll, handleAddToQueue, handleApplyFilters, handleDeletePlaylist])

  return (
    <>
      <PlaylistCard />

      <Modal
        title={playlist.name || (playlist.filters?.genres?.[0] || 'Untitled Playlist')}
        onClose={() => setShowSongs(false)}
        isOpen={showSongs}
      >
        <div className="h-[70vh] w-full">
          <AutoSizer>
            {({ height, width }: { height: number, width: number }) => (
              <List
                height={height}
                rowCount={songIds.length}
                rowHeight={100}
                rowRenderer={rowRenderer}
                width={width}
                overscanRowCount={6}
              />
            )}
          </AutoSizer>
        </div>
      </Modal>
    </>
  )
})

export default Playlist
