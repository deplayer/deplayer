import { AutoSizer, List, ListRowRenderer } from 'react-virtualized'

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
    <div><div>{props.error}</div></div>
    : null

  const rowRenderer = (props: any): any => {
    const artistId = props.tableIds[props.index]
    const artist = props.collection.artists[artistId]

    if (!artist || !artist.id) {
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
            rowCount={props.tableIds.length}
            rowHeight={50}
            rowRenderer={rowRenderer as ListRowRenderer}
            width={width}
            overscanRowCount={6}
            recomputeRowHeights
          />
        )}
      </AutoSizer>
      <div className="table-status">
        Total items: <b>{props.tableIds.length}</b>
      </div>
      {errors}
    </div>
  )
}

export default ArtistTable
