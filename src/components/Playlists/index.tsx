import Playlist from './Playlist'
import PlaylistRow from './PlaylistRow'
import PlaylistRowSortMenu, { type SortMode } from './PlaylistRowSortMenu'
import FeaturedHero from './FeaturedHero'
import GenreWall from './GenreWall'
import { usePickFeatured } from './usePickFeatured'
import EmptyState from '../common/EmptyState/index'
import { memo, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'
import { useMediaCount, useSongsByGenre, usePlaylists, useSmartPlaylists, useQueue, useSettings } from '../../stores/livestore/hooks'
import { getEmptyStateFallback, queueStep, searchStep } from '../common/EmptyState/emptyStateFallback'
import EmptyStateAction from '../common/EmptyState/EmptyStateAction'
import type { IconType } from '../common/Icon'

type PlaylistType = {
  _id: string;
  trackIds: Array<string>;
  filters?: Record<string, string[]>;
  id?: string;
  name?: string;
}

const sortPlaylists = (list: PlaylistType[], mode: SortMode): PlaylistType[] => {
  if (mode === 'default') return list
  const copy = [...list]
  if (mode === 'alphabetical') {
    copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else if (mode === 'trackCount') {
    copy.sort((a, b) => b.trackIds.length - a.trackIds.length)
  }
  return copy
}

const PlaylistRowSection = memo(({ title, icon, playlists, dispatch }: {
  title?: string,
  icon?: IconType,
  playlists: PlaylistType[],
  dispatch: Dispatch
}) => {
  const [sort, setSort] = useState<SortMode>('default')

  const sorted = useMemo(() => sortPlaylists(playlists, sort), [playlists, sort])

  const items = useMemo(() =>
    sorted.map((playlist) => (
      <div
        key={playlist.id || playlist._id}
        className="snap-start shrink-0 w-64"
      >
        <Playlist dispatch={dispatch} playlist={playlist} />
      </div>
    ))
  , [sorted, dispatch])

  if (!playlists.length) return null

  return (
    <PlaylistRow
      title={title}
      icon={icon}
      actions={<PlaylistRowSortMenu value={sort} onChange={setSort} />}
    >
      {items}
    </PlaylistRow>
  )
})

const Playlists = memo(() => {
  const dispatch = useDispatch()
  const playlists = usePlaylists()
  const smartPlaylists = useSmartPlaylists()
  const songsByGenre = useSongsByGenre()
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()

  const mediaCount = useMediaCount()

  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }

  const queueTrackIds = liveQueue?.shuffle
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)

  const hasQueueItems = queueTrackIds.length > 0
  const hasCollectionItems = mediaCount > 0
  const hasSearchableProviders = liveSettings?.providers
    ? Object.values(liveSettings.providers).some((provider: unknown) => (provider as Record<string, unknown>)?.enabled)
    : false

  const transformedPlaylists = useMemo(() =>
    (playlists as unknown as Array<{ id: string; name: string; trackIds: unknown }>).map((playlist) => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: typeof playlist.trackIds === 'string'
        ? JSON.parse(playlist.trackIds)
        : (playlist.trackIds || []) as string[]
    }))
  , [playlists])

  const genrePlaylists: PlaylistType[] = useMemo(() =>
    Object.keys(songsByGenre || {}).map(genre => ({
      _id: `genre-${genre}`,
      id: `genre-${genre}`,
      name: genre,
      trackIds: songsByGenre[genre] || [],
      filters: {
        genres: [genre],
        types: [],
        artists: [],
        providers: []
      }
    }))
  , [songsByGenre])

  const transformedSmartPlaylists = useMemo(() =>
    smartPlaylists.map((playlist) => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: songsByGenre[playlist.filters.genres[0]] || [],
      filters: playlist.filters
    }))
  , [smartPlaylists, songsByGenre])

  const { action: fallbackAction, description: fallbackDescription } = getEmptyStateFallback([
    queueStep(hasQueueItems),
    { condition: hasCollectionItems, action: <EmptyStateAction to='/collection' icon='faDatabase' label='message.jumpToCollection' />, description: 'message.addSongsToQueue' },
    searchStep(hasSearchableProviders),
  ])

  if (!transformedPlaylists.length && !transformedSmartPlaylists.length && !genrePlaylists.length) {
    return (
      <EmptyState
        icon="faCompactDisc"
        title="message.noPlaylists"
        description={fallbackDescription || 'message.createPlaylistHint'}
        action={fallbackAction}
      />
    )
  }

  const featured = usePickFeatured(transformedPlaylists, transformedSmartPlaylists, genrePlaylists)

  return (
    <div className='playlists z-10 flex flex-col w-full overflow-y-auto h-full py-6'>
      {featured && (
        <FeaturedHero
          playlist={featured.playlist}
          reasonKey={featured.reasonKey}
          dispatch={dispatch}
        />
      )}
      <PlaylistRowSection
        title="titles.yourLibrary"
        icon="faMusic"
        playlists={transformedPlaylists}
        dispatch={dispatch}
      />
      <PlaylistRowSection
        title="titles.smartPlaylists"
        icon="faMagic"
        playlists={transformedSmartPlaylists}
        dispatch={dispatch}
      />
      <GenreWall genres={Object.keys(songsByGenre || {})} />
    </div>
  )
})

export default Playlists
