import * as React from 'react'
import { Dispatch } from 'redux'

import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import PlaylistsMenuItem from './PlaylistsMenuItem'
import SearchMenuItem from './SearchMenuItem'
import QueueMenuItem from './QueueMenuItem'
import ArtistsMenuItem from './ArtistsMenuItem'
import { inSection } from '../../utils/router'

type ContentProps = {
  dispatch: Dispatch,
  collection: any,
  queue: any,
  app: any,
  location: any,
  onSetSidebarOpen: Function
}

const SidebarContents = (props: ContentProps) => {
  return (
    <div onClick={() => props.onSetSidebarOpen()}>
      <h4 className="text-xl">
        { 'deplay' }
      </h4>
      <ul>
        <QueueMenuItem
          current={inSection(props.location, '(queue)?')}
          totalItems={props.queue.trackIds.length}
        />
        <SearchMenuItem
          current={inSection(props.location, 'search-results')}
          totalItems={props.collection.searchResults.length}
        />
        <PlaylistsMenuItem current={inSection(props.location, 'playlists')} />
        <CollectionMenuItem
          current={inSection(props.location, 'collection')}
          totalItems={props.collection.totalRows}
        />
        <ArtistsMenuItem
          current={inSection(props.location, 'artists')}
          totalItems={Object.keys(props.collection.artists).length}
        />
        <SettingsMenuItem current={inSection(props.location, 'settings')} />
      </ul>

      <section className='sidebar-meta'>
        <a
          href={'https://gitlab.com/deplay/deplay'}
          title="Show me the code"
          target="_blank"
        >
          <i className='fa fa-gitlab' />
        </a>

        <a
          href={'https://gitlab.com/deplay/deplay/tags'}
          title="Show me the code"
          target="_blank"
        >
          { props.app.version }
        </a>

      </section>
    </div>
  )
}

export default SidebarContents
