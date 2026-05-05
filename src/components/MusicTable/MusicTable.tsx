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
import { useMediaById, useQueue, useCurrentPlayingSongId, useFavoriteIds } from '../../stores/livestore/hooks'
import { useUIStore } from '../../stores/uiStore'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'
import type { MediaRow } from '../../types/media'
import { State as QueueState } from '../../reducers/queue'

type QueueData = Record<string, unknown> | QueueState | null

type Props = {
  error?: string,
  tableIds: Array<string>,
  mediaMap?: Record<string, MediaRow>,  // Optional: Media lookup map for performance
  queue?: QueueData,  // Optional: Queue data to avoid N queries
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
  dispatch: Dispatch,
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

const LoadingRow = ({ style, slim }: { style: React.CSSProperties, slim: boolean }) => (
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
// Fast path: when mediaMap + queue are provided as props, skip all LiveStore hooks
const SongRowDirect = React.memo(({ 
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
  visibleIds,
  favoriteIds,
}: {
  songId: string
  mediaMap: Record<string, MediaRow>
  queue: QueueData
  isCurrent: boolean
  style: React.CSSProperties
  slim: boolean
  mqlMatch: boolean
  dispatch: Dispatch
  disableAddButton?: boolean
  disableCovers?: boolean
  visibleIds: string[]
  favoriteIds: Set<string>
}) => {
  const song = mediaMap[songId]
  
  if (!song || !song.id) {
    return <LoadingRow style={style} slim={slim} />
  }
  
  const onClick = () => {
    dispatch({ type: types.PLAY_SONG, songId: song.id, contextIds: visibleIds })
  }
  
  return (
    <SongRow
      song={song}
      queue={queue as QueueState | undefined}
      isCurrent={isCurrent}
      onClick={onClick}
      dispatch={dispatch}
      disableAddButton={disableAddButton}
      disableCovers={disableCovers}
      mqlMatch={mqlMatch}
      slim={slim}
      style={style}
      favoriteIds={favoriteIds}
    />
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.slim === nextProps.slim &&
    prevProps.mqlMatch === nextProps.mqlMatch &&
    prevProps.disableAddButton === nextProps.disableAddButton &&
    prevProps.disableCovers === nextProps.disableCovers
  )
})

// Slow path: uses LiveStore hooks for data fetching (fallback when no mediaMap/queue provided)
const SongRowWithHooks = React.memo(({ 
  songId, 
  isCurrent,
  style, 
  slim,
  mqlMatch,
  dispatch,
  disableAddButton,
  disableCovers,
  visibleIds,
  favoriteIds,
}: {
  songId: string
  isCurrent: boolean
  style: React.CSSProperties
  slim: boolean
  mqlMatch: boolean
  dispatch: Dispatch
  disableAddButton?: boolean
  disableCovers?: boolean
  visibleIds: string[]
  favoriteIds: Set<string>
}) => {
  const song = useMediaById(songId)
  const liveQueue = useQueue('default')
  
  if (!song || !song.id) {
    return <LoadingRow style={style} slim={slim} />
  }
  
  const onClick = () => {
    dispatch({ type: types.PLAY_SONG, songId: song.id, contextIds: visibleIds })
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
      favoriteIds={favoriteIds}
    />
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.slim === nextProps.slim &&
    prevProps.mqlMatch === nextProps.mqlMatch &&
    prevProps.disableAddButton === nextProps.disableAddButton &&
    prevProps.disableCovers === nextProps.disableCovers
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
  const favoriteIds = useFavoriteIds() // Single query, shared by all rows
  const loading = useUIStore(s => s.loading)
  const mqlMatch = useUIStore(s => s.mqlMatch)
  const location = useLocation()
  
  // Get Redux dispatch for features not yet migrated (buttons, actions)
  const dispatch = useDispatch()
  
  const [isToolbarVisible, setIsToolbarVisible] = React.useState(true)
  const lastScrollTopRef = React.useRef(0)
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

  // Use refs for values that change frequently but shouldn't cause rowRenderer to be recreated
  const tableIdsRef = React.useRef(tableIds)
  tableIdsRef.current = tableIds
  const currentSongIdRef = React.useRef(currentSongId)
  currentSongIdRef.current = currentSongId
  const mediaMapRef = React.useRef(mediaMap)
  mediaMapRef.current = mediaMap
  const favoriteIdsRef = React.useRef(favoriteIds)
  favoriteIdsRef.current = favoriteIds

  const rowRenderer = React.useCallback(({
    index,       // Index of row
    key,         // Key for React reconciliation
    style,       // Style object to be applied to row (to position it);
    slim
    // This must be passed through to the rendered row element.
  }: { index: number, key: string, style: React.CSSProperties, slim: boolean }): React.ReactNode => {
    const songId = tableIdsRef.current[index]
    const isCurrent = songId === currentSongIdRef.current

    const currentMediaMap = mediaMapRef.current
    const currentQueue = liveQueue
    const sharedProps = {
      key,
      songId,
      isCurrent,
      style, 
      slim,
      mqlMatch,
      dispatch,
      disableAddButton,
      disableCovers: slim || disableCovers,
      visibleIds: tableIdsRef.current,
      favoriteIds: favoriteIdsRef.current,
    }

    // Fast path: skip LiveStore hooks when data is provided via props
    if (currentMediaMap && currentQueue) {
      return <SongRowDirect {...sharedProps} mediaMap={currentMediaMap} queue={currentQueue} />
    }

    // Slow path: use LiveStore hooks
    return <SongRowWithHooks {...sharedProps} />
  }, [liveQueue, mqlMatch, dispatch, disableAddButton, disableCovers])

  // Stable rowRenderer wrapper that includes slim without creating new function refs
  const slimRef = React.useRef(slim)
  slimRef.current = slim
  const stableRowRenderer = React.useCallback(
    ({ index, key, style }: { index: number, key: string, style: React.CSSProperties }) =>
      rowRenderer({ index, key, style, slim: !!slimRef.current }),
    [rowRenderer]
  )

  // Only scroll to current song on initial mount, not on every re-render
  const initialScrollIndex = React.useRef(
    !disableCurrent ? tableIds.indexOf(currentSongId || '') : -1
  )
  const [scrollToIndex, setScrollToIndex] = React.useState(initialScrollIndex.current)

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

  // Clear scrollToIndex after first render so it doesn't fight with user scrolling
  React.useEffect(() => {
    if (scrollToIndex >= 0) {
      const timer = setTimeout(() => setScrollToIndex(-1), 100)
      return () => clearTimeout(timer)
    }
  }, [scrollToIndex])

  const handleScroll = React.useCallback(({ clientHeight, scrollHeight, scrollTop }: { clientHeight: number, scrollHeight: number, scrollTop: number }) => {
    // If content isn't scrollable, always keep toolbar visible
    if (clientHeight === scrollHeight) {
      setIsToolbarVisible(true)
      setIsToolbarHidden(false)
      return
    }

    const scrollingDown = scrollTop > lastScrollTopRef.current
    lastScrollTopRef.current = scrollTop

    // Only update state when visibility actually changes
    if (scrollingDown) {
      setIsToolbarVisible(prev => prev ? false : prev)
    } else {
      setIsToolbarHidden(false)
      setIsToolbarVisible(prev => prev ? prev : true)
    }
  }, [])

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
            rowRenderer={stableRowRenderer}
            width={width}
            overscanRowCount={10}
            scrollToIndex={scrollToIndex >= 0 ? scrollToIndex : undefined}
            onScroll={handleScroll}
          />
        )}
      </AutoSizer>
      {errors}
    </React.Fragment>
  )
}

export default MusicTable
