import * as React from 'react'
import { Dispatch } from 'redux'

import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import PlaylistsMenuItem from './PlaylistsMenuItem'
import SearchMenuItem from './SearchMenuItem'
import QueueMenuItem from './QueueMenuItem'
import ArtistsMenuItem from './ArtistsMenuItem'
import MenuItem from './MenuItem'
import { inSection } from '../../utils/router'
import Icon from '../common/Icon'

type ContentProps = {
  dispatch: Dispatch,
  collection: any,
  queue: any,
  app: any,
  location: any,
  onSetSidebarOpen: Function
}

const SidebarContents = (props: ContentProps) => {
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds
  return (
    <div className='flex flex-col' onClick={() => props.onSetSidebarOpen()}>
      <h4 className="text-xl text-center py-4 bg-gray-900 text-blue-500 tracking-wider">
        <span className='text-blue-200'>d</span>eplayer
      </h4>
      <ul className='flex flex-col'>
        <MenuItem
          current={inSection(props.location, '$')}
          url='/'
          title='Explore'
          label='Explore'
          icon={<Icon icon='faGlobe' />}
        />
        <QueueMenuItem
          current={inSection(props.location, 'queue')}
          totalItems={trackIds.length}
        />
        <SearchMenuItem
          current={inSection(props.location, 'search-results')}
          totalItems={props.collection.searchResults.length}
        />
        <PlaylistsMenuItem current={inSection(props.location, 'playlists')} />
        <CollectionMenuItem
          collection={props.collection}
          current={inSection(props.location, '(collection.*)')}
          totalItems={props.collection.totalRows}
        />
        <ArtistsMenuItem
          current={inSection(props.location, 'artists')}
          totalItems={Object.keys(props.collection.artists).length}
        />
        <MenuItem
          current={inSection(props.location, 'providers')}
          url='/providers'
          title='Providers'
          label='Providers'
          icon={<Icon icon='faPlug' />}
        />
        <MenuItem
          current={inSection(props.location, 'wiki')}
          url='/wiki'
          title='Help'
          label='Help'
          icon={<Icon icon='faLifeRing' />}
        />
        <SettingsMenuItem current={inSection(props.location, 'settings')} />
      </ul>

      <section className='p-6 pt-8 bottom-0 text-xs text-center w-full'>
        <a
          href={'https://gitlab.com/deplayer/deplayer'}
          rel="noreferrer"
          title="Show me the code"
          target="_blank"
        >
          <Icon icon='faGitlab' />
        </a>

        <a
          href={'https://gitlab.com/deplayer/deplayer/tags'}
          className='ml-2'
          rel="noreferrer"
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
