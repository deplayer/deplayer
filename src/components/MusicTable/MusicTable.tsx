import { AutoSizer, List } from 'react-virtualized'
import { useLocation } from 'react-router-dom'
import * as React from 'react'
import classNames from 'classnames'

import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import ClearQueueButton from '../Buttons/ClearQueueButton'
import PlayAllButton from '../Buttons/PlayAllButton'
import PlayNextButton from '../Buttons/PlayNextButton'
import SaveQueueButton from '../Buttons/SaveQueueButton'
import SongRow from './SongRow'
import Spinner from '../Spinner'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import * as types from '../../constants/ActionTypes'
import { State as AppState } from '../../reducers/app'
import FilterPanel from '../Collection/FilterPanel'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { Dispatch } from 'redux'

export type Props = {
  error?: string,
  queue: QueueState,
  app: AppState,
  tableIds: Array<string>,
  collection: CollectionState,
  dispatch: Dispatch,
  disableCurrent?: boolean,
  disableCovers?: boolean,
  disableAddButton?: boolean,
  slim?: boolean,
}

const Toolbar = ({ 
  isToolbarVisible, 
  isToolbarHidden, 
  handleTransitionEnd, 
  tableIds, 
  actions,
  dispatch,
  collection,
}: { 
  isToolbarVisible: boolean, 
  isToolbarHidden: boolean, 
  handleTransitionEnd: () => void, 
  tableIds: Array<string>, 
  actions: React.ReactNode,
  dispatch: Dispatch,
  collection: CollectionState,
}) => {
  const location = useLocation()
  
  return (
      <div
        className={`h-14 p-2 bg-base-200/50 toolbar flex justify-between items-center text-base-content top-15 right-0 z-10 transition-transform duration-100 ${
          isToolbarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ display: isToolbarHidden ? 'none' : 'flex' }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className='flex items-center gap-4 flex-1'>
          <div className='p-2'>
            #<b>{tableIds.length}</b>
          </div>
          {location.pathname === '/collection' && (
            <div className='flex-1 max-w-xl'>
              <FilterPanel
                dispatch={dispatch}
                collection={collection}
                activeFilters={collection.activeFilters}
              />
            </div>
          )}
        </div>
        <div className='flex gap-1'>
          {actions}
        </div>
      </div>
    )
  }

const LoadingRow = ({ style, slim }: { style: any, slim: boolean }) => (
  <div 
    style={style}
    className={classNames(
      'flex items-center px-4 animate-pulse bg-base-200/10',
      {
        'h-20': !slim,
        'h-16': slim
      }
    )}
  >
    {!slim && <div className="w-12 h-12 bg-base-300 rounded mr-4" />} {/* Cover placeholder only if not slim */}
    <div className="flex-1">
      <div className="h-4 bg-base-300 rounded w-1/3 mb-2" /> {/* Title placeholder */}
      <div className="h-3 bg-base-300/70 rounded w-1/4" /> {/* Subtitle placeholder */}
    </div>
    <div className="flex space-x-2">
      <div className="w-8 h-8 bg-base-300 rounded" /> {/* Button placeholder */}
      <div className="w-8 h-8 bg-base-300 rounded" /> {/* Button placeholder */}
    </div>
  </div>
)

const MusicTable = ({ error, queue, app, tableIds, collection, dispatch, disableCurrent, disableCovers, disableAddButton, slim }: Props) => {
  const [isToolbarVisible, setIsToolbarVisible] = React.useState(true)
  const [lastScrollTop, setLastScrollTop] = React.useState(0)
  const [isToolbarHidden, setIsToolbarHidden] = React.useState(false)

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
    style,        // Style object to be applied to row (to position it);
    slim
    // This must be passed through to the rendered row element.
  }: { index: number, key: string, style: any, slim: boolean }): any => {
    const songId = tableIds[index]
    const song = collection.rows[songId]

    if (!song) {
      return <LoadingRow style={style} slim={slim} />
    }

    if (!song.id) {
      return null
    }

    return (
      <SongRow
        queue={queue}
        mqlMatch={app.mqlMatch}
        key={song.id}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
        }}
        disableAddButton={disableAddButton}
        disableCovers={slim || disableCovers} // Force disable covers in slim mode
        slim={slim}
        dispatch={dispatch}
      />
    )
  }

  // Track the position of current playing to jump there
  const currentIndex = !disableCurrent ? tableIds.indexOf(queue.currentPlaying || '') : 0

  const getActions = () => {
    if (location.pathname.match(/\/song\/.*/)) {
      return <ToggleMiniQueueButton />
    }

    switch (location.pathname) {
      case '/queue':
        return (
          <>
            <ClearQueueButton className='btn-sm' />
            <SaveQueueButton className='btn-sm' />
            <PlayAllButton className='btn-sm' dispatch={dispatch} />
          </>
        )
      case '/collection':
        return (
        <>
          <AddNewMediaButton className='btn-sm' />
          <PlayAllButton className='btn-sm' dispatch={dispatch} />
          {queue.currentPlaying && <PlayNextButton className='btn-sm' dispatch={dispatch} />}
        </>
      )
      case '/search-results':
        return (
          <>
            <PlayAllButton className='btn-sm' dispatch={dispatch} />
            {queue.currentPlaying && (
              <PlayNextButton 
                className='btn-sm'
                dispatch={dispatch} 
                songs={tableIds.map(id => collection.rows[id]).filter(Boolean)} 
              />
            )}
          </>
        )
      default:
        return null
    }
  }

  const actions = React.useMemo(() => getActions(), [location.pathname, collection.activeFilters])

  const handleScroll = ({ clientHeight, scrollHeight, scrollTop }: { clientHeight: number, scrollHeight: number, scrollTop: number }) => {
    // If content isn't scrollable, always keep toolbar visible
    if (clientHeight === scrollHeight) {
      setIsToolbarVisible(true)
      setIsToolbarHidden(false)
      return
    }

    if (scrollTop > lastScrollTop) {
      setIsToolbarVisible(false)
    } else {
      setIsToolbarHidden(false)
      setIsToolbarVisible(true)
    }
    setLastScrollTop(scrollTop)
  }

  const handleTransitionEnd = () => {
    if (!isToolbarVisible) {
      setIsToolbarHidden(true)
    }
  }

  return (
    <React.Fragment>
      <Toolbar
        isToolbarVisible={isToolbarVisible}
        isToolbarHidden={isToolbarHidden}
        handleTransitionEnd={handleTransitionEnd}
        tableIds={tableIds}
        actions={actions}
        dispatch={dispatch}
        collection={collection}
      />
      <AutoSizer className='music-table'>
        {({ height, width }: { height: number, width: number }) => (
          <List
            height={height}
            rowCount={tableIds.length}
            rowHeight={slim ? 80 : 100}
            rowRenderer={({ index, key, style }) => rowRenderer({ index, key, style, slim: !!slim })}
            width={width}
            overscanRowCount={10}
            scrollToIndex={currentIndex}
            recomputeRowHeights
            onScroll={handleScroll}
          />
        )}
      </AutoSizer>
      {errors}
    </React.Fragment>
  )
}

export default MusicTable
