import { useState, useCallback, useMemo, memo } from 'react'
import { Translate } from 'react-redux-i18n'
import { AutoSizer, List } from 'react-virtualized'
import Icon from '../common/Icon'
import Button from '../common/Button'
import Modal from '../common/Modal'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'
import type { MediaRow } from '../../types/media'

import { useNavigate } from 'react-router-dom'
import { Dispatch } from 'redux'
import { useFilteredMedia, useMediaMapForIds } from '../../stores/livestore/hooks'
import { useAppStore } from '../../stores/livestore/store'
import { addToQueueAction } from '../../stores/livestore/actions'
import { deleteSmartPlaylistAction } from '../../stores/livestore/actions/smartPlaylists'
import { useUIStore } from '../../stores/uiStore'
import type { Filter } from '../../types/collection'

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
  const setFilter = useUIStore(s => s.setFilter)
  const clearFilters = useUIStore(s => s.clearFilters)
  const liveStore = useAppStore()
  
  // PERF: For smart playlists, use database-level filtering (not entire mediaMap)
  const smartPlaylistFilters = useMemo(() => ({
    genres: playlist.filters?.genres || [],
    types: playlist.filters?.types || [],
    artists: playlist.filters?.artists || [],
    providers: playlist.filters?.providers || [],
    favorites: Boolean(playlist.filters?.favorites?.[0] === 'true')
  }), [playlist.filters])
  
  // This hook only loads filtered IDs, not entire library
  const filteredTrackIds = useFilteredMedia(smartPlaylistFilters)
  
  // Get the effective track IDs based on playlist type
  const effectiveTrackIds = useMemo(() => {
    if (isSmartPlaylist) {
      return filteredTrackIds
    }
    return playlist.trackIds
  }, [isSmartPlaylist, filteredTrackIds, playlist.trackIds])
  
  // PERF: Only load media for tracks in THIS playlist (not entire library)
  const mediaMap = useMediaMapForIds(effectiveTrackIds)

  const handlePlayAll = useCallback(() => {
    if (effectiveTrackIds.length === 0) return
    dispatch({ type: types.PLAY_LIST, trackIds: effectiveTrackIds })
  }, [effectiveTrackIds, dispatch])

  const handleAddToQueue = useCallback(async () => {
    if (!liveStore || effectiveTrackIds.length === 0) return
    
    try {
      await addToQueueAction(liveStore, effectiveTrackIds)
    } catch (error) {
      console.error('Failed to add playlist to queue:', error)
    }
  }, [liveStore, effectiveTrackIds])

  const handleApplyFilters = useCallback(() => {
    clearFilters()
    Object.entries(playlist.filters || {}).forEach(([filterType, values]) => {
      if (values.length) {
        setFilter(filterType as keyof Filter, values)
      }
    })
    navigate('/collection')
  }, [playlist.filters, clearFilters, setFilter, navigate])

  const handleDeletePlaylist = useCallback(async () => {
    if (!liveStore || !playlist.id) return
    
    try {
      await deleteSmartPlaylistAction(liveStore, playlist.id)
    } catch (error) {
      console.error('Failed to delete smart playlist:', error)
    }
  }, [liveStore, playlist.id])

  const tracksWithCovers = useMemo(() => {
    const tracks = playlist.trackIds.map(id => mediaMap[id])
    const uniqueAlbumTracks = new Map()
    
    tracks.forEach(track => {
      if (!track?.cover?.thumbnailUrl) return
      if (!track.albumId) return

      if (!uniqueAlbumTracks.has(track.albumId)) {
        uniqueAlbumTracks.set(track.albumId, track)
      }
    })

    return Array.from(uniqueAlbumTracks.values()).slice(0, 4)
  }, [playlist.trackIds, mediaMap])

  const totalDuration = useMemo(() => 
    playlist.trackIds.reduce((acc, id) => {
      const track = mediaMap[id] as MediaRow
      return acc + (track?.duration || 0)
    }, 0)
  , [playlist.trackIds, mediaMap])

  // Use the already-computed effectiveTrackIds (no need for applyFilters)
  const songIds = effectiveTrackIds

  const uniqueAlbumCount = useMemo(() =>
    new Set(
      playlist.trackIds
        .map(id => mediaMap[id]?.albumId)
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
          dispatch({ type: types.PLAY_SONG, songId: song.id, contextIds: songIds })
        }}
        song={song}
      />
    )
  }, [songIds, mediaMap, dispatch, liveStore])

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
            {tracksWithCovers.map((track: MediaRow, index: number) => (
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
