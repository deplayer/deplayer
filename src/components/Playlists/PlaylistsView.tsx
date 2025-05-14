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
import { AutoSizer, Grid } from 'react-virtualized'

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
          <Icon icon={showGenres ? 'faList' : 'faFilter'} className="mr-2" />
          <Translate value={showGenres ? 'buttons.showPlaylists' : 'buttons.showGenres'} />
        </Button>
      </div>

      <div className="container mx-auto px-4">
        {showGenres ? (
          <div className="card bg-base-200 shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              <Translate value="titles.genres" />
            </h2>
            <GenreTagCloud collection={collection} dispatch={dispatch} />
          </div>
        ) : (
          <>
            {/* Smart Playlists */}
            {transformedSmartPlaylists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Smart Playlists</h2>
                <AutoSizer disableHeight>
                  {({ width }) => {
                    const columnCount = 4
                    const columnWidth = Math.floor(width / columnCount)
                    const rowHeight = 220 // Adjust to match Playlist card height
                    const rowCount = Math.ceil(transformedSmartPlaylists.length / columnCount)
                    return (
                      <Grid
                        cellRenderer={({ columnIndex, rowIndex, key, style }) => {
                          const idx = rowIndex * columnCount + columnIndex
                          if (idx >= transformedSmartPlaylists.length) return null
                          const playlist = transformedSmartPlaylists[idx]
                          return (
                            <div key={key} style={style}>
                              <Playlist
                                playlist={playlist}
                                collection={collection}
                                dispatch={dispatch}
                              />
                            </div>
                          )
                        }}
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={rowHeight * Math.min(rowCount, 2)} // Show at least 2 rows, adjust as needed
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        overscanRowCount={2}
                      />
                    )
                  }}
                </AutoSizer>
              </div>
            )}

            {/* Regular Playlists */}
            {playlist.playlists.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Playlists</h2>
                <AutoSizer disableHeight>
                  {({ width }) => {
                    const columnCount = 4
                    const columnWidth = Math.floor(width / columnCount)
                    const rowHeight = 220 // Adjust to match Playlist card height
                    const rowCount = Math.ceil(playlist.playlists.length / columnCount)
                    return (
                      <Grid
                        cellRenderer={({ columnIndex, rowIndex, key, style }) => {
                          const idx = rowIndex * columnCount + columnIndex
                          if (idx >= playlist.playlists.length) return null
                          const playlistItem = playlist.playlists[idx]
                          return (
                            <div key={key} style={style}>
                              <Playlist
                                playlist={playlistItem}
                                collection={collection}
                                dispatch={dispatch}
                              />
                            </div>
                          )
                        }}
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={rowHeight * Math.min(rowCount, 2)} // Show at least 2 rows, adjust as needed
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        overscanRowCount={2}
                      />
                    )
                  }}
                </AutoSizer>
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