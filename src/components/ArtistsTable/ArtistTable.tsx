import { AutoSizer, List, Grid } from 'react-virtualized'
import { useState } from 'react'
import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'

import ArtistRow from './ArtistRow'
import ArtistGridItem from './ArtistGridItem'
import Button from '../common/Button'
import Icon from '../common/Icon'
import EmptyState from '../common/EmptyState/index'
import { useArtistsMap, useSongsByArtist, useMediaCount } from '../../stores/livestore/hooks'
import { useSettings } from '../../stores/livestore/hooks'
import { useUI } from '../../contexts'

interface GridProps {
  rowIndex: number
  columnIndex: number
  key: string
  style: React.CSSProperties
}

const ArtistTable = () => {
  // Get data from LiveStore hooks
  const artistsMap = useArtistsMap()
  const songsByArtist = useSongsByArtist()
  const liveSettings = useSettings()
  const { sidebarToggled, mqlMatch } = useUI()
  
  // PERF: Use count hook instead of loading entire library
  const mediaCount = useMediaCount()
  
  const [isGridView, setIsGridView] = useState(false)
  
  const tableIds = Object.keys(artistsMap)
  const hasCollectionItems = mediaCount > 0
  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider: any) => provider?.enabled) : 
    false

  if (!tableIds.length) {
    let emptyStateProps = {
      icon: "faUser" as const,
      title: "message.noArtists",
      description: "message.addSongsToSeeArtists",
      action: hasCollectionItems ? (
        <Link to="/collection" className="btn btn-primary">
          <Icon icon="faMusic" className="mr-2" />
          <Translate value="message.jumpToCollection" />
        </Link>
      ) : hasSearchableProviders ? (
        <Link to="/search" className="btn btn-primary">
          <Icon icon="faSearch" className="mr-2" />
          <Translate value="message.startSearch" />
        </Link>
      ) : (
        <Link to="/settings" className="btn btn-primary">
          <Icon icon="faPlug" className="mr-2" />
          <Translate value="message.addProvider" />
        </Link>
      )
    }

    if (hasSearchableProviders) {
      emptyStateProps.description = "message.startSearchingForMusic"
    } else if (!hasCollectionItems) {
      emptyStateProps.description = "message.addSearchableProvider"
    }

    return <EmptyState {...emptyStateProps} />
  }

  const rowRenderer = (props: any): any => {
    const artistId = tableIds[props.index]
    const artist = artistsMap[artistId]

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
    
    const artist = artistsMap[artistId]
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
