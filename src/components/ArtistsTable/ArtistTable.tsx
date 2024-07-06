import { AutoSizer, List } from 'react-virtualized'

import { State as CollectionState } from '../../reducers/collection'
import ArtistRow from './ArtistRow'

export type Props = {
  error?: string,
  queue: any,
  collection: CollectionState,
  dispatch: (action: any) => any
}

const ArtistTable = ({ collection: { artists, songsByArtist } }: Props) => {
  const tableIds = Object.keys(artists)

  const rowRenderer = (props: any): any => {
    const artistId = tableIds[props.index]
    const artist = artists[artistId]

    return (
      <ArtistRow
        key={props.key}
        artist={artist}
        songs={songsByArtist[artist.id]}
        style={props.style}
      />
    )
  }

  return (
    <div className='collection z-10'>
      <AutoSizer className='artists-table'>
        {({ height, width }: { height: number, width: number }) => (
          <List
            height={height}
            rowCount={tableIds.length || 0}
            rowHeight={50}
            rowRenderer={rowRenderer}
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
