import { useDispatch } from 'react-redux'
import { State as CollectionState } from '../../reducers/collection'
import { State as SettingsState } from '../../reducers/settings'
import { State as AppState } from '../../reducers/app'
import { State as QueueState } from '../../reducers/queue'
import { State as PlaylistState } from '../../reducers/playlist'
import Playlist from './Playlist'
import GenreTagCloud from './GenreTagCloud'
import { useMemo, useState } from 'react'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { Translate } from 'react-redux-i18n'

type Props = {
  collection: CollectionState
  settings: SettingsState
  app: AppState
  queue: QueueState
  playlist: PlaylistState
}

const PlaylistsView = ({ collection, playlist }: Props) => {
  const dispatch = useDispatch()
  const [showGenres, setShowGenres] = useState(false)

  // Transform smart playlists to match playlist interface
  const transformedSmartPlaylists = useMemo(() => 
    playlist.smartPlaylists.map(playlist => ({
      _id: playlist.id,
      id: playlist.id,
      name: playlist.name,
      trackIds: collection.songsByGenre[playlist.filters.genres[0]] || [],
      filters: playlist.filters
    }))
  , [playlist.smartPlaylists, collection.songsByGenre])

  return (
    <div className="collection z-10">
      {/* Top Bar */}
      <div className="flex justify-end mb-4 px-4">
        <Button
          transparent
          onClick={() => setShowGenres(!showGenres)}
          className="flex items-center"
        >
          <Icon icon={showGenres ? 'faList' : 'faBookmark'} className="mr-2" />
          <Translate value={showGenres ? 'buttons.showPlaylists' : 'buttons.showGenres'} />
        </Button>
      </div>

      <div className="container mx-auto px-4">
        {/* Content */}
        {showGenres ? (
          <GenreTagCloud collection={collection} dispatch={dispatch} />
        ) : (
          <>
            {/* Smart Playlists */}
            {transformedSmartPlaylists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Smart Playlists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {transformedSmartPlaylists.map(playlist => (
                    <Playlist
                      key={playlist.id}
                      playlist={playlist}
                      collection={collection}
                      dispatch={dispatch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Playlists */}
            {playlist.playlists.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Playlists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {playlist.playlists.map(playlist => (
                    <Playlist
                      key={playlist._id}
                      playlist={playlist}
                      collection={collection}
                      dispatch={dispatch}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="table-status">
        Total items: <b>{playlist.playlists.length + transformedSmartPlaylists.length}</b>
      </div>
    </div>
  )
}

export default PlaylistsView 