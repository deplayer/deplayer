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
import type { QueueState } from '../../stores/livestore/queue'

type QueueData = QueueState | null

/** Rows rendered beyond the viewport by react-virtualized's overscan. */
const OVERSCAN_ROWS = 10
/** Grow the data window this many rows before the loaded edge (2x overscan). */
const GROW_AHEAD_OF_ROWS = OVERSCAN_ROWS * 2

type Props = {
  error?: string,
  tableIds: Array<string>,
  mediaMap?: Record<string, MediaRow>,  // Optional: Media lookup map for performance
  queue?: QueueData,  // Optional: Queue data to avoid N queries
  disableCurrent?: boolean,
  disableCovers?: boolean,
  disableAddButton?: boolean,
  slim?: boolean,
  /** Live total for the current filter; falls back to the loaded row count. */
  total?: number,
  /** True when the window can grow (more rows beyond the loaded window). */
  hasMore?: boolean,
  /** Called when the user scrolls near the end of the loaded window. */
  onLoadMore?: () => void,
  /** One-shot resolver for ALL ids in the current filter (Play All/Next). */
  resolveAllIds?: () => Promise<string[]>,
}

const Toolbar = ({ 
  isToolbarVisible, 
  isToolbarHidden, 
  handleTransitionEnd, 
  tableIds,
  total,
  actions,
}: {
  isToolbarVisible: boolean,
  isToolbarHidden: boolean,
  handleTransitionEnd: () => void,
  tableIds: Array<string>,
  total?: number,
  actions: React.ReactNode,
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
            #<b>{total ?? tableIds.length}</b>
          </div>
          {location.pathname === '/collection' && (
            <div className='flex-1 max-w-xl'>
              <FilterPanel />
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
    <div className="flex gap-x-2">
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
      queue={queue ?? undefined}
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

// Slow path: fetches the song via LiveStore (fallback when no mediaMap is
// provided). The queue comes from MusicTable's single subscription: a
// per-row useQueue would load and assemble every queue item per mounted row.
const SongRowWithHooks = React.memo(({ 
  songId, 
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
  const song = useMediaById(songId)
  
  if (!song || !song.id) {
    return <LoadingRow style={style} slim={slim} />
  }
  
  const onClick = () => {
    dispatch({ type: types.PLAY_SONG, songId: song.id, contextIds: visibleIds })
  }
  
  return (
    <SongRow
      song={song}
      queue={queue ?? undefined}
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
    prevProps.queue === nextProps.queue &&
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
  slim,
  total,
  hasMore,
  onLoadMore,
  resolveAllIds,
}: Props) => {
  
  // ContextualMenu reads queue.trackIds / queue.currentPlaying, so the real row
  // must be available. We always subscribe; queueProp (if supplied) wins to let
  // parents share an existing subscription.
  const liveQueueFetched = useQueue('default')
  const liveQueue = queueProp ?? liveQueueFetched
  
  // Get data from LiveStore hooks
  const currentSongId = useCurrentPlayingSongId('default')
  const favoriteIds = useFavoriteIds() // Single query, shared by all rows
  const booting = useUIStore(s => s.bootStatus === 'booting')
  const mqlMatch = useUIStore(s => s.mqlMatch)
  const location = useLocation()
  
  // Get Redux dispatch for features not yet migrated (buttons, actions)
  const dispatch = useDispatch()
  
  const [isToolbarVisible, setIsToolbarVisible] = React.useState(true)
  const lastScrollTopRef = React.useRef(0)
  const [isToolbarHidden, setIsToolbarHidden] = React.useState(false)

  // Window growth: react-virtualized reports rendered ranges; grow the data
  // window when the viewport approaches the loaded edge. The threshold is
  // derived from OVERSCAN so the two can't silently desync.
  const handleRowsRendered = React.useCallback(({ stopIndex }: { stopIndex: number }) => {
    if (hasMore && onLoadMore && stopIndex >= tableIds.length - 1 - GROW_AHEAD_OF_ROWS) onLoadMore()
  }, [hasMore, onLoadMore, tableIds.length])

  const errors = error && <div>{error}</div>

  // Refs for values that change frequently but shouldn't recreate rowRenderer.
  // currentSongId is intentionally NOT a ref: it must be in rowRenderer's
  // closure so the React-virtualized List re-renders visible rows (with a
  // fresh isCurrent) when the active track changes.
  const tableIdsRef = React.useRef(tableIds)
  tableIdsRef.current = tableIds
  const mediaMapRef = React.useRef(mediaMap)
  mediaMapRef.current = mediaMap
  const favoriteIdsRef = React.useRef(favoriteIds)
  favoriteIdsRef.current = favoriteIds
  const liveQueueRef = React.useRef(liveQueue)
  liveQueueRef.current = liveQueue

  const rowRenderer = React.useCallback(({
    index,       // Index of row
    key,         // Key for React reconciliation
    style,       // Style object to be applied to row (to position it);
    slim
    // This must be passed through to the rendered row element.
  }: { index: number, key: string, style: React.CSSProperties, slim: boolean }): React.ReactNode => {
    const songId = tableIdsRef.current[index]
    const isCurrent = songId === currentSongId

    const currentMediaMap = mediaMapRef.current
    const currentQueue = liveQueueRef.current
    const sharedProps = {
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
      return <SongRowDirect key={key} {...sharedProps} mediaMap={currentMediaMap} queue={currentQueue} />
    }

    // Slow path: fetch each song via LiveStore
    return <SongRowWithHooks key={key} {...sharedProps} queue={currentQueue} />
  // liveQueue is read via liveQueueRef, but it stays in the deps on purpose: a new rowRenderer identity
  // makes the virtualized List re-render visible rows when the queue changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveQueue, mqlMatch, dispatch, disableAddButton, disableCovers, currentSongId])

  // Stable rowRenderer wrapper that includes slim without creating new function refs
  const slimRef = React.useRef(slim)
  slimRef.current = slim
  const stableRowRenderer = React.useCallback(
    ({ index, key, style }: { index: number, key: string, style: React.CSSProperties }) =>
      rowRenderer({ index, key, style, slim: !!slimRef.current }),
    [rowRenderer]
  )

  // Auto-scroll to the active track on mount and whenever it changes
  // (next/prev/error). The clear-effect below resets scrollToIndex after a
  // short window so user scrolling isn't permanently overridden.
  const [scrollToIndex, setScrollToIndex] = React.useState(-1)
  React.useEffect(() => {
    if (disableCurrent) return
    const idx = tableIds.indexOf(currentSongId || '')
    if (idx >= 0) setScrollToIndex(idx)
  }, [currentSongId, disableCurrent, tableIds])

  const actions = React.useMemo(() => {
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
          <PlayAllButton className='btn-sm' resolveIds={resolveAllIds} />
          {currentSongId && <PlayNextButton className='btn-sm' resolveIds={resolveAllIds} />}
        </>
      )
      case '/search-results':
        return (
          <>
            <PlayAllButton className='btn-sm' resolveIds={resolveAllIds} />
            {currentSongId && (
              <PlayNextButton
                className='btn-sm'
                resolveIds={resolveAllIds}
              />
            )}
          </>
        )
      default:
        return null
    }
  }, [location.pathname, currentSongId, tableIds, resolveAllIds])

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

  // Early return lives after every hook on purpose: a conditional return
  // placed above a hook changes the hook order when `bootStatus` flips and
  // React throws. Keep it as the last statement before the render.
  if (booting) {
    return (
      <div className={`queue`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  return (
    <React.Fragment>
      <Toolbar
        isToolbarVisible={isToolbarVisible}
        isToolbarHidden={isToolbarHidden}
        handleTransitionEnd={handleTransitionEnd}
        tableIds={tableIds}
        total={total}
        actions={actions}
      />
      <AutoSizer className='music-table'>
        {({ height, width }: { height: number, width: number }) => (
          <List
            height={height}
            rowCount={tableIds.length}
            rowHeight={slim ? 80 : 100}
            rowRenderer={stableRowRenderer}
            width={width}
            overscanRowCount={OVERSCAN_ROWS}
            onRowsRendered={handleRowsRendered}
            onScroll={handleScroll}
          />
        )}
      </AutoSizer>
      {errors}
    </React.Fragment>
  )
}

export default React.memo(MusicTable)
