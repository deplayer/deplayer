import { AutoSizer, List } from 'react-virtualized'
import { Route } from 'react-router-dom'
import * as React from 'react'

import ClearQueueButton from '../Buttons/ClearQueueButton'
import PlayAllButton from '../Buttons/PlayAllButton'
import SaveQueueButton from '../Buttons/SaveQueueButton'
import SongRow from './SongRow'
import Spinner from '../Spinner'
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
  const errors = props.error && <div>{ props.error }</div>

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
    isScrolling, // The List is currently being scrolled
    isVisible,   // This row is visible within the List (eg it is not an overscanned row)
    key,         // Unique key within array of rendered rows
    parent,      // Reference to the parent List (instance)
    style        // Style object to be applied to row (to position it);
    // This must be passed through to the rendered row element.
  }) => {
    const songId = props.tableIds[index]
    const song = props.collection.rows[songId]

    if (!song || !song.id) {
      return null
    }

    return (
      <SongRow
        mqlMatch={props.app.mqlMatch}
        key={key}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          props.dispatch({type: types.SET_CURRENT_PLAYING, songId: song.id})
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

  return (
    <React.Fragment>
      <div className='p-2 h-8 toolbar flex justify-between items-center'>
        <div className='p-2'>
          Total items: <b>{ props.tableIds.length }</b>
        </div>
        <div className='actions'>
          <Route path="/queue" component={() => <ClearQueueButton /> } />
          <Route path="/queue" component={() => <SaveQueueButton /> } />
          <Route path="/" component={() => <PlayAllButton dispatch={props.dispatch} /> } />
        </div>
      </div>
      <AutoSizer className='music-table'>
        {({ height, width }) => (
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
