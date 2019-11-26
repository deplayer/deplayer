import * as React from 'react'
import { AutoSizer, List } from 'react-virtualized'

import ArtistRow from './ArtistRow'

export type Props = {
  error?: string,
  queue: any,
  tableIds: Array<string>,
  collection: any,
  dispatch: (action: any) => any
}

const ArtistTable = (props: Props) => {
  const errors = props.error ?
    <div><div>{ props.error }</div></div>
    : null

  const rowRenderer = ({
    index,       // Index of row
    isScrolling, // The List is currently being scrolled
    isVisible,   // This row is visible within the List (eg it is not an overscanned row)
    key,         // Unique key within array of rendered rows
    parent,      // Reference to the parent List (instance)
    style        // Style object to be applied to row (to position it);
    // This must be passed through to the rendered row element.
  }) => {
    const artistId = props.tableIds[index]
    const artist = props.collection.artists[artistId]

    if (!artist || !artist.id) {
      return null
    }

    return (
      <ArtistRow
        key={key}
        artist={artist}
        songs={props.collection.songsByArtist[artist.id]}
        style={style}
      />
    )
  }

  return (
    <div className='collection z-10'>
      <AutoSizer className='artists-table'>
        {({ height, width }) => (
          <List
            height={height}
            rowCount={props.tableIds.length}
            rowHeight={50}
            rowRenderer={rowRenderer}
            width={width}
            overscanRowCount={6}
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      <div className="table-status">
        Total items: <b>{ props.tableIds.length }</b>
      </div>
      {errors}
    </div>
  )
}

export default ArtistTable
