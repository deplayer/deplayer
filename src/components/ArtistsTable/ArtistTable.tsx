import { AutoSizer, List, Grid } from 'react-virtualized'
import { useState } from 'react'
import { Translate } from 'react-redux-i18n'

import { State as CollectionState } from '../../reducers/collection'
import ArtistRow from './ArtistRow'
import ArtistGridItem from './ArtistGridItem'
import Button from '../common/Button'
import Icon from '../common/Icon'

export type Props = {
  error?: string,
  queue: any,
  collection: CollectionState,
  dispatch: (action: any) => any
}

const ArtistTable = ({ collection: { artists, songsByArtist } }: Props) => {
  const [isGridView, setIsGridView] = useState(false)
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

  const gridRenderer = (props: any): any => {
    const artistId = tableIds[props.rowIndex * 4 + props.columnIndex]
    if (!artistId) return null
    
    const artist = artists[artistId]
    return (
      <ArtistGridItem
        key={props.key}
        artist={artist}
        songs={songsByArtist[artist.id]}
        style={props.style}
      />
    )
  }

  const columnCount = Math.floor(window.innerWidth / 240)
  const columnWidth = 240
  const rowHeight = 280
  const rowCount = Math.ceil(tableIds.length / columnCount)

  return (
    <div className='collection z-10'>
      <div className="flex justify-end mb-4 px-4">
        <Button
          transparent
          onClick={() => setIsGridView(!isGridView)}
          className="flex items-center"
        >
          <Icon icon={isGridView ? 'faList' : 'faGrip'} className="mr-2" />
          <Translate value={isGridView ? 'buttons.listView' : 'buttons.gridView'} />
        </Button>
      </div>

      <AutoSizer className='artists-table'>
        {({ height, width }: { height: number, width: number }) => (
          isGridView ? (
            <Grid
              cellRenderer={gridRenderer}
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              overscanRowCount={2}
            />
          ) : (
            <List
              height={height}
              rowCount={tableIds.length || 0}
              rowHeight={50}
              rowRenderer={rowRenderer}
              width={width}
              overscanRowCount={6}
              recomputeRowHeights
            />
          )
        )}
      </AutoSizer>
      <div className="table-status">
        Total items: <b>{tableIds.length}</b>
      </div>
    </div>
  )
}

export default ArtistTable
