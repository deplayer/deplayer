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
import FilterPanel from '../Collection/FilterPanel'
import { useMediaById, useQueue, useCurrentPlayingSongId } from '../../stores/livestore/hooks'
import { useUI } from '../../contexts'
import { useDispatch } from 'react-redux'

type Props = {
  error?: string,
  tableIds: Array<string>,
  mediaMap?: Record<string, any>,  // Optional: Media lookup map for performance
  queue?: any,  // Optional: Queue data to avoid N queries
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
}: { 
  isToolbarVisible: boolean, 
  isToolbarHidden: boolean, 
  handleTransitionEnd: () => void, 
  tableIds: Array<string>, 
  actions: React.ReactNode,
  dispatch: any,
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
      <div key="btn1" className="w-8 h-8 bg-base-300 rounded" /> {/* Button placeholder */}
      <div key="btn2" className="w-8 h-8 bg-base-300 rounded" /> {/* Button placeholder */}
    </div>
  </div>
)

// Wrapper component for individual song loading
const SongRowWrapper = React.memo(({ 
  songId, 
  mediaMap,
  queue,
  isCurrent,
  style, 
  slim,
  mqlMatch,
  dispatch,
  disableAddButton,
  disableCovers,
}: {
  songId: string
  mediaMap?: Record<string, any>
  queue?: any
  isCurrent: boolean
  style: any
  slim: boolean
  mqlMatch: boolean
  dispatch: any
  disableAddButton?: boolean
  disableCovers?: boolean
}) => {
  // Use provided mediaMap for efficient lookup, fallback to hook if not provided
  const shouldFetchSong = !mediaMap
  const songFromHook = useMediaById(shouldFetchSong ? songId : undefined)
  const song = mediaMap?.[songId] ?? songFromHook
  
  // Use provided queue, fallback to hook if not provided
  const shouldFetchQueue = !queue
  const queueFromHook = useQueue(shouldFetchQueue ? 'default' : undefined)
  const liveQueue = queue ?? queueFromHook
  
  if (!song) {
    return <LoadingRow style={style} slim={slim} />
  }
  
  if (!song.id) {
    return null
  }
  
  const onClick = () => {
    dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
  }
  
  return (
    <SongRow
      song={song}
      queue={liveQueue}
      isCurrent={isCurrent}
      onClick={onClick}
      dispatch={dispatch}
      disableAddButton={disableAddButton}
      disableCovers={disableCovers}
      mqlMatch={mqlMatch}
      slim={slim}
      style={style}
    />
  )
}, (prevProps, nextProps) => {
  // Enhanced memo comparison - skip re-render if all relevant props are equal
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.slim === nextProps.slim &&
    prevProps.mqlMatch === nextProps.mqlMatch &&
    prevProps.disableAddButton === nextProps.disableAddButton &&
    prevProps.disableCovers === nextProps.disableCovers
    // mediaMap and queue are stable references from parent, no need to compare
  )
})

const MusicTable = ({ 
  error, 
  tableIds, 
  mediaMap,
  queue: queueProp,
  disableCurrent, 
  disableCovers, 
  disableAddButton, 
  slim 
}: Props) => {
  // Only fetch queue as fallback if not provided (for backwards compatibility)
  // Using conditional to avoid hook rules violation
  const shouldFetchQueue = !queueProp
  const liveQueueFallback = useQueue(shouldFetchQueue ? 'default' : undefined)
  const liveQueue = queueProp ?? liveQueueFallback
  
  // Get data from LiveStore hooks
  const currentSongId = useCurrentPlayingSongId('default')
  const { loading, mqlMatch } = useUI()
  const location = useLocation()
  
  // Get Redux dispatch for features not yet migrated (buttons, actions)
  const dispatch = useDispatch()
  
  const [isToolbarVisible, setIsToolbarVisible] = React.useState(true)
  const [lastScrollTop, setLastScrollTop] = React.useState(0)
  const [isToolbarHidden, setIsToolbarHidden] = React.useState(false)

  const errors = error && <div>{error}</div>

  if (loading) {
    return (
      <div className={`queue`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  const rowRenderer = ({
    index,       // Index of row
    key,         // Key for React reconciliation
    style,       // Style object to be applied to row (to position it);
    slim
    // This must be passed through to the rendered row element.
  }: { index: number, key: string, style: any, slim: boolean }): any => {
    const songId = tableIds[index]
    const isCurrent = songId === currentSongId

    return (
      <SongRowWrapper 
        key={key}
        songId={songId}
        mediaMap={mediaMap}
        queue={liveQueue}
        isCurrent={isCurrent}
        style={style} 
        slim={slim}
        mqlMatch={mqlMatch}
        dispatch={dispatch}
        disableAddButton={disableAddButton}
        disableCovers={slim || disableCovers}
      />
    )
  }

  // Track the position of current playing to jump there
  const currentIndex = !disableCurrent ? tableIds.indexOf(currentSongId || '') : 0

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
            <PlayAllButton className='btn-sm' mediaIds={tableIds} />
          </>
        )
      case '/collection':
        return (
        <>
          <AddNewMediaButton className='btn-sm' />
          <PlayAllButton className='btn-sm' mediaIds={tableIds} />
          {currentSongId && <PlayNextButton className='btn-sm' mediaIds={tableIds} />}
        </>
      )
      case '/search-results':
        return (
          <>
            <PlayAllButton className='btn-sm' mediaIds={tableIds} />
            {currentSongId && (
              <PlayNextButton 
                className='btn-sm'
                mediaIds={tableIds}
              />
            )}
          </>
        )
      default:
        return null
    }
  }

  const actions = React.useMemo(() => getActions(), [location.pathname, currentSongId, tableIds.length])

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
