import Playlist from './Playlist'
import EmptyState from '../common/EmptyState/index'
import { State as PlaylistState } from '../../reducers/playlist'
import { State as QueueState } from '../../reducers/queue'
import { State as SettingsState } from '../../reducers/settings'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon'
import { Translate } from 'react-redux-i18n'
import { memo, useMemo } from 'react'
import { useMediaMap, useSongsByGenre } from '../../stores/livestore/hooks'

type Props = {
  playlist: PlaylistState,
  queue: QueueState,
  settings?: SettingsState,
  dispatch: any
}

type EmptyStateProps = {
  icon: "faCompactDisc" | "faMusic" | "faSearch" | "faPlug";
  title: string;
  description: string;
  action: React.ReactNode;
}

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

const Playlists = memo((props: Props) => {
  const { queue, settings } = props
  const { playlists, smartPlaylists } = props.playlist
  
  // LiveStore hooks
  const mediaMap = useMediaMap()
  const songsByGenre = useSongsByGenre()
  
  const hasQueueItems = queue.trackIds.length > 0
  const hasCollectionItems = Object.keys(mediaMap).length > 0
  const hasSearchableProviders = settings?.settings?.providers ? 
    Object.values(settings.settings.providers).some(provider => provider.enabled) : 
    false

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
    smartPlaylists.map(playlist => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: songsByGenre[playlist.filters.genres[0]] || [],
      filters: playlist.filters
    }))
  , [smartPlaylists, songsByGenre]);

  if (!playlists.length && !smartPlaylists.length && !genrePlaylists.length) {
    let emptyStateProps: EmptyStateProps = {
      icon: "faCompactDisc",
      title: "message.noPlaylists",
      description: "message.createPlaylistHint",
      action: null
    }

    if (hasQueueItems) {
      emptyStateProps.action = (
        <Link to="/queue" className="btn btn-primary">
          <Icon icon="faMusic" className="mr-2" />
          <Translate value="message.goToQueue" />
        </Link>
      )
    } else if (hasCollectionItems) {
      emptyStateProps.description = "message.addSongsToQueue"
      emptyStateProps.action = (
        <Link to="/collection" className="btn btn-primary">
          <Icon icon="faDatabase" className="mr-2" />
          <Translate value="message.jumpToCollection" />
        </Link>
      )
    } else if (hasSearchableProviders) {
      emptyStateProps.description = "message.startSearchingForMusic"
      emptyStateProps.action = (
        <Link to="/search" className="btn btn-primary">
          <Icon icon="faSearch" className="mr-2" />
          <Translate value="message.startSearch" />
        </Link>
      )
    } else {
      emptyStateProps.description = "message.addSearchableProvider"
      emptyStateProps.action = (
        <Link to="/settings" className="btn btn-primary">
          <Icon icon="faPlug" className="mr-2" />
          <Translate value="message.addProvider" />
        </Link>
      )
    }

    return <EmptyState {...emptyStateProps} />
  }

  return (
    <div className='playlists z-10 flex flex-col w-full overflow-y-auto h-full py-6'>
      <PlaylistSection 
        playlists={playlists} 
        dispatch={props.dispatch}
      />
      <PlaylistSection 
        playlists={transformedSmartPlaylists} 
        dispatch={props.dispatch}
      />
      {genrePlaylists.length > 0 && (
        <PlaylistSection 
          title="titles.genrePlaylists"
          playlists={genrePlaylists} 
          dispatch={props.dispatch}
        />
      )}
    </div>
  )
});

export default Playlists
