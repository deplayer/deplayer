import Playlist from './Playlist'
import EmptyState from '../common/EmptyState/index'
import Icon from '../common/Icon'
import { Translate } from 'react-redux-i18n'
import { memo, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useMediaCount, useSongsByGenre, usePlaylists, useSmartPlaylists, useQueue, useSettings } from '../../stores/livestore/hooks'
import { getEmptyStateFallback, queueStep, searchStep } from '../common/EmptyState/emptyStateFallback'
import EmptyStateAction from '../common/EmptyState/EmptyStateAction'

type PlaylistType = {
  _id: string;
  trackIds: Array<string>;
  filters?: Record<string, string[]>;
  id?: string;
  name?: string;
}

const PlaylistSection = memo(({ title, playlists, dispatch }: { 
  title?: string, 
  playlists: PlaylistType[], 
  dispatch: any 
}) => {
  if (!playlists.length) return null;

  const memoizedPlaylists = useMemo(() => 
    playlists.map((playlist) => (
      <Playlist
        dispatch={dispatch}
        key={playlist.id || playlist._id}
        playlist={playlist}
      />
    ))
  , [playlists, dispatch]);

  return (
    <div className="mb-8">
      {title && (
        <h2 className="text-xl font-semibold mb-6 px-4">
          <Icon icon="faMusic" className="mr-2" />
          <Translate value={title} />
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {memoizedPlaylists}
      </div>
    </div>
  );
});

const Playlists = memo(() => {
  const dispatch = useDispatch()
  // LiveStore hooks - get playlists, smart playlists, queue, and settings
  const playlists = usePlaylists()
  const smartPlaylists = useSmartPlaylists()
  const songsByGenre = useSongsByGenre()
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()
  
  // PERF: Use count hook instead of loading entire library
  const mediaCount = useMediaCount()
  
  // Parse trackIds from LiveStore queue (can be JSON string or array)
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
  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider: any) => provider.enabled) : 
    false

  // Transform LiveStore playlists to match component expectations
  const transformedPlaylists = useMemo(() => 
    playlists.map((playlist: any) => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: typeof playlist.trackIds === 'string' 
        ? JSON.parse(playlist.trackIds) 
        : (playlist.trackIds || [])
    }))
  , [playlists]);

  // Memoize genre playlists generation
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
  , [songsByGenre]);

  // Memoize smart playlists transformation
  const transformedSmartPlaylists = useMemo(() => 
    smartPlaylists.map((playlist: any) => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: songsByGenre[playlist.filters.genres[0]] || [],
      filters: playlist.filters
    }))
  , [smartPlaylists, songsByGenre]);

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

  return (
    <div className='playlists z-10 flex flex-col w-full overflow-y-auto h-full py-6'>
      <PlaylistSection 
        playlists={transformedPlaylists} 
        dispatch={dispatch}
      />
      <PlaylistSection 
        playlists={transformedSmartPlaylists} 
        dispatch={dispatch}
      />
      {genrePlaylists.length > 0 && (
        <PlaylistSection 
          title="titles.genrePlaylists"
          playlists={genrePlaylists} 
          dispatch={dispatch}
        />
      )}
    </div>
  )
});

export default Playlists
