import { AutoSizer, List, Grid } from 'react-virtualized'
import { useState } from 'react'
import { Translate } from 'react-redux-i18n'

import { State as CollectionState } from '../../reducers/collection'
import ArtistRow from './ArtistRow'
import ArtistGridItem from './ArtistGridItem'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { State as AppState } from '../../reducers/app'
import { State as QueueState } from '../../reducers/queue'

export type Props = {
  error?: string,
  queue: QueueState,
  collection: CollectionState,
  app: AppState
}

interface GridProps {
  rowIndex: number
  columnIndex: number
  key: string
  style: React.CSSProperties
}

const ArtistTable = ({ collection: { artists, songsByArtist }, app: { sidebarToggled, mqlMatch } }: Props) => {
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

  const gridRenderer = (props: GridProps): any => {
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

  const correctSidebarWidth = (sidebarToggled && mqlMatch) ? 1 : 0
  const columnCount = Math.floor((window.innerWidth / 240) - correctSidebarWidth)
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
              className='flex w-full justify-center'
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
