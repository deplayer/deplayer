import * as React from 'react'
import { AutoSizer, List, ListRowRenderer } from 'react-virtualized'

import { State as CollectionState } from '../../reducers/collection'
import ArtistRow from './ArtistRow'

export type Props = {
  error?: string,
  queue: any,
  collection: CollectionState,
  dispatch: (action: any) => any
}

const ArtistTable = (props: Props) => {
  const tableIds = props.collection.artists || []

  const rowRenderer = (props: any): any => {
    const artistId = props.tableIds[props.index]
    const artist = props.collection.artists[artistId]

    if (!artistId || !artist || !artist.id) {
      return null
    }

    return (
      <ArtistRow
        key={props.key}
        artist={artist}
        songs={props.collection.songsByArtist[artist.id]}
        style={props.style}
      />
    )
  }

  return (
    <div className='collection z-10'>
      <AutoSizer className='artists-table'>
        {({ height, width }) => (
          <List
            height={height}
            rowCount={tableIds.length || 0}
            rowHeight={50}
            rowRenderer={rowRenderer as ListRowRenderer}
            width={width}
            overscanRowCount={6}
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      <div className="table-status">
        Total items: <b>{tableIds.length}</b>
      </div>
    </div>
  )
}

export default ArtistTable
