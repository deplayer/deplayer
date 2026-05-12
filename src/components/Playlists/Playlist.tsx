import { useState, useCallback, useMemo, memo } from 'react'
import { AutoSizer, List } from 'react-virtualized'
import Modal from '../common/Modal'
import SongRow from '../MusicTable/SongRow'
import PlaylistCard, { type FilterChip } from './PlaylistCard'
import { usePlaylistStats } from './usePlaylistStats'
import * as types from '../../constants/ActionTypes'

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

  const filteredTrackIds = useFilteredMedia(smartPlaylistFilters)

  const effectiveTrackIds = useMemo(() => {
    if (isSmartPlaylist) return filteredTrackIds
    return playlist.trackIds
  }, [isSmartPlaylist, filteredTrackIds, playlist.trackIds])

  const stats = usePlaylistStats(playlist.trackIds)
  const songsMediaMap = useMediaMapForIds(effectiveTrackIds)

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

  const rowRenderer = useCallback(({ key, index, style }: { key: string, index: number, style: React.CSSProperties }) => {
    const songId = effectiveTrackIds[index]
    const song = songsMediaMap[songId]
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
          dispatch({ type: types.PLAY_SONG, songId: song.id, contextIds: effectiveTrackIds })
        }}
        song={song}
      />
    )
  }, [effectiveTrackIds, songsMediaMap, dispatch])

  const displayName = playlist.name || (playlist.filters?.genres?.[0] || 'Untitled Playlist')

  const chips: FilterChip[] | undefined = useMemo(() => {
    if (!isSmartPlaylist || !playlist.filters) return undefined
    const out: FilterChip[] = []
    const f = playlist.filters
    const pairs: Array<[string[] | undefined, string]> = [
      [f.genres, 'filters.genre'],
      [f.artists, 'filters.artist'],
      [f.types, 'filters.type'],
      [f.providers, 'filters.provider'],
    ]
    for (const [values, labelKey] of pairs) {
      values?.forEach(v => out.push({ labelKey, value: v }))
    }
    if (f.favorites?.[0] === 'true') {
      out.push({ labelKey: 'filters.favorites', value: '★' })
    }
    return out.slice(0, 3) // cap to keep cards compact
  }, [isSmartPlaylist, playlist.filters])

  return (
    <>
      <PlaylistCard
        name={displayName}
        trackCount={stats.trackCount}
        albumCount={stats.albumCount}
        duration={stats.duration}
        firstCover={stats.firstCover}
        isSmartPlaylist={isSmartPlaylist}
        chips={chips}
        onPlayAll={handlePlayAll}
        onShowSongs={() => setShowSongs(true)}
        onAddToQueue={handleAddToQueue}
        onApplyFilters={handleApplyFilters}
        onDelete={handleDeletePlaylist}
      />

      <Modal
        title={displayName}
        onClose={() => setShowSongs(false)}
        isOpen={showSongs}
      >
        <div className="h-[70vh] w-full">
          <AutoSizer>
            {({ height, width }: { height: number, width: number }) => (
              <List
                height={height}
                rowCount={effectiveTrackIds.length}
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
