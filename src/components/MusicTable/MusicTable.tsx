import * as React from 'react'
import { AutoSizer, List } from 'react-virtualized'

import * as types from '../../constants/ActionTypes'
import SongRow from './SongRow'

export type Props = {
  error?: string,
  queue: any,
  tableIds: Array<string>,
  collection: any,
  totalSongs: number,
  dispatch: (action: any) => any,
  disableAddButton?: boolean,
}

const MusicTable = (props: Props) => {
  const errors = props.error ?
    <div><div>{ props.error }</div></div>
    : null

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
        key={key}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          props.dispatch({type: types.SET_CURRENT_PLAYING, songId: song.id})
        }}
        disableAddButton={props.disableAddButton}
        dispatch={props.dispatch}
      />
    )
  }

  // Track the position of current playing to jump there
  const currentIndex = props.tableIds.indexOf(props.queue.currentPlaying)

  return (
    <React.Fragment>
      <AutoSizer className='music-table'>
        {({ height, width }) => (
          <List
            height={height}
            rowCount={props.tableIds.length}
            rowHeight={100}
            rowRenderer={rowRenderer}
            width={width}
            overscanRowCount={6}
            scrollToIndex={currentIndex}
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      <div className="table-status">
        Total items: { props.tableIds.length }
      </div>
      {errors}
    </React.Fragment>
  )
}

export default MusicTable
