import { AutoSizer, List } from 'react-virtualized'
import { useLocation } from 'react-router-dom'
import * as React from 'react'

import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import ClearQueueButton from '../Buttons/ClearQueueButton'
import PlayAllButton from '../Buttons/PlayAllButton'
import SaveQueueButton from '../Buttons/SaveQueueButton'
import SongRow from './SongRow'
import Spinner from '../Spinner'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import * as types from '../../constants/ActionTypes'

export type Props = {
  error?: string,
  queue: any,
  app: any,
  tableIds: Array<string>,
  collection: any,
  dispatch: (action: any) => any,
  disableCurrent?: boolean,
  disableCovers?: boolean,
  disableAddButton?: boolean,
  slim?: boolean,
}

const MusicTable = (props: Props) => {
  const errors = props.error && <div>{props.error}</div>
  const location = useLocation()

  if (props.app.loading) {
    return (
      <div className={`queue`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  const id = props.queue.currentPlaying

  const rowRenderer = ({
    index,       // Index of row
    key,         // Unique key within array of rendered rows
    style        // Style object to be applied to row (to position it);
    // This must be passed through to the rendered row element.
  }: { index: number, key: number, style: any }) => {
    const songId = props.tableIds[index]
    const song = props.collection.rows[songId]

    if (!song || !song.id) {
      return null
    }

    return (
      <SongRow
        queue={props.queue}
        songsLength={props.tableIds.length}
        mqlMatch={props.app.mqlMatch}
        key={key}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
        }}
        disableAddButton={props.disableAddButton}
        disableCovers={props.disableCovers}
        slim={props.slim}
        dispatch={props.dispatch}
      />
    )
  }

  // Track the position of current playing to jump there
  const currentIndex = !props.disableCurrent ? props.tableIds.indexOf(props.queue.currentPlaying) : null

  const getActions = () => {
    switch (location.pathname) {
      case '/queue':
        return (
          <>
            <ClearQueueButton />
            <SaveQueueButton />
            <PlayAllButton dispatch={props.dispatch} />
          </>
        )
      case '/collection':
        return (<><AddNewMediaButton /><PlayAllButton dispatch={props.dispatch} /></>)
      case '/song/:id':
        return (<ToggleMiniQueueButton />)
      case '/search-results':
        return <PlayAllButton dispatch={props.dispatch} />
      default:
        return null
    }
  }

  return (
    <React.Fragment>
      <div className='p-2 h-8 toolbar flex justify-between items-center text-base'>
        <div className='p-2'>
          #<b>{props.tableIds.length}</b>
        </div>
        <div className='actions flex items-center'>
          {getActions()}
        </div>
      </div>
      <AutoSizer className='music-table'>
        {({ height, width }: {height: number, width: number}) => (
          <List
            height={height}
            rowCount={props.tableIds.length}
            rowHeight={props.slim ? 80 : 100}
            rowRenderer={rowRenderer}
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
