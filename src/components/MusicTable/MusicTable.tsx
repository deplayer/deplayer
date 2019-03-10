import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { AutoSizer, List } from 'react-virtualized'

import * as types from '../../constants/ActionTypes'
import SongRow from './SongRow'

export type Props = {
  error?: string,
  queue: any,
  tableIds: any,
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
      return (
        <li
          className='song-row'
          key={key}
          style={style}
        >
          <Translate value='error.noSongFound' />
        </li>
      )
    }

    return (
      <SongRow
        key={key}
        song={song}
        isCurrent={id === song.id}
        style={style}
        onClick={() => {
          props.dispatch({type: types.SET_CURRENT_PLAYING, song: song.id})
        }}
        disableAddButton={props.disableAddButton}
        dispatch={props.dispatch}
      />
    )
  }

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
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      {errors}
    </React.Fragment>
  )
}

export default MusicTable
