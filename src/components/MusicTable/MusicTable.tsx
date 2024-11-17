import { AutoSizer, List } from 'react-virtualized'
import { useLocation } from 'react-router-dom'
import * as React from 'react'
import { Filter } from '../../reducers/collection'

import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import ClearQueueButton from '../Buttons/ClearQueueButton'
import PlayAllButton from '../Buttons/PlayAllButton'
import SaveQueueButton from '../Buttons/SaveQueueButton'
import SongRow from './SongRow'
import Spinner from '../Spinner'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import * as types from '../../constants/ActionTypes'
import { State as AppState } from '../../reducers/app'
import FilterPanel from '../Collection/FilterPanel'

export type Props = {
  error?: string,
  queue: any,
  app: AppState,
  tableIds: Array<string>,
  collection: any,
  dispatch: (action: any) => any,
  disableCurrent?: boolean,
  disableCovers?: boolean,
  disableAddButton?: boolean,
  slim?: boolean,
}

const MusicTable = ({ error, queue, app, tableIds, collection, dispatch, disableCurrent, disableCovers, disableAddButton, slim }: Props) => {
  const errors = error && <div>{error}</div>
  const location = useLocation()

  if (app.loading) {
    return (
      <div className={`queue`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  const id = queue.currentPlaying

  const rowRenderer = ({
    index,       // Index of row
    key,         // Unique key within array of rendered rows
    style,        // Style object to be applied to row (to position it);
    slim
    // This must be passed through to the rendered row element.
  }: { index: number, key: string, style: any, slim: boolean }): any => {
    const songId = tableIds[index]
    const song = collection.rows[songId]

    if (!song || !song.id) {
      return null
    }

    return (
      <SongRow
        queue={queue}
        songsLength={tableIds.length}
        mqlMatch={app.mqlMatch}
        key={key}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
        }}
        disableAddButton={disableAddButton}
        disableCovers={disableCovers}
        slim={slim}
        dispatch={dispatch}
      />
    )
  }

  // Track the position of current playing to jump there
  const currentIndex = !disableCurrent ? tableIds.indexOf(queue.currentPlaying) : 0

  const handleClearFilters = () => {
    dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
  }
  const handleFilterChange = (filterType: keyof Filter, values: string[]) => {
    dispatch({
      type: types.SET_COLLECTION_FILTER,
      filterType,
      values
    })
  }

  const getActions = () => {
    if (location.pathname.match(/\/song\/.*/)) {
      return <ToggleMiniQueueButton />
    }

    switch (location.pathname) {
      case '/queue':
        return (
          <>
            <ClearQueueButton />
            <SaveQueueButton />
            <PlayAllButton dispatch={dispatch} />
          </>
        )
      case '/collection':
        return (
        <>
          <FilterPanel
            dispatch={dispatch}
            collection={collection}
            activeFilters={collection.activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          <AddNewMediaButton />
          <PlayAllButton dispatch={dispatch} />
        </>
      )
      case '/search-results':
        return <PlayAllButton dispatch={dispatch} />
      default:
        return null
    }
  }

  const actions = React.useMemo(() => getActions(), [location.pathname, collection.activeFilters])

  return (
    <React.Fragment>
      <div className='p-2 toolbar flex justify-between items-center text-base'>
        <div className='p-2'>
          #<b>{tableIds.length}</b>
        </div>
        <div className='flex'>
          {actions}
        </div>
      </div>
      <AutoSizer className='music-table'>
        {({ height, width }: { height: number, width: number }) => (
          <List
            height={height}
            rowCount={tableIds.length}
            rowHeight={slim ? 80 : 100}
            rowRenderer={({ index, key, style }) => rowRenderer({ index, key, style, slim: !!slim })}
            width={width}
            overscanRowCount={6}
            scrollToIndex={currentIndex}
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      {errors}
    </React.Fragment>
  )
}

export default MusicTable
