import { Dispatch } from 'redux'
import React from 'react'

import CommandBar from '../CommandBar'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import PlaylistsMenuItem from './PlaylistsMenuItem'
import SearchMenuItem from './SearchMenuItem'
import QueueMenuItem from './QueueMenuItem'
import ArtistsMenuItem from './ArtistsMenuItem'
import MenuItem from './MenuItem'
import ExploreMenuItem from './ExploreMenuItem'

import { inSection } from '../../utils/router'
import Icon from '../common/Icon'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { State as AppState } from '../../reducers/app'
import { State as PlaylistsState } from '../../reducers/playlist'
import { useLocation } from 'react-router'

type ContentProps = {
  dispatch: Dispatch,
  collection: CollectionState,
  queue: QueueState,
  app: AppState,
  playlist: PlaylistsState,
  onSetSidebarOpen: Function
}

function getInitialTheme() {
  const theme = localStorage.getItem('theme')
  return theme || document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const SwitchThemeButton = () => {
  const [theme, setTheme] = React.useState(getInitialTheme())

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    } else {
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }

  if (theme === 'light') {
    return <Icon onClick={toggleTheme} icon='faMoon' className='cursor-pointer text-center text-sky-900 hover:text-sky-600 text-xl absolute right-4 top-5' />
  } else {
    return <Icon onClick={toggleTheme} icon='faSun' className='cursor-pointer text-center text-sky-900 hover:text-sky-600 text-xl absolute right-4 top-5' />
  }
}

const SidebarContents = (props: ContentProps) => {
  const location = useLocation()
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds

  return (
    <div className='flex flex-col' onClick={() => props.onSetSidebarOpen()}>
      <SwitchThemeButton />
      <h4 className="text-xl text-center py-4 bg-gray-900 text-blue-500 tracking-wider select-none">
        <span className='text-blue-200'>d</span>eplayer
      </h4>
      <ul className='flex flex-col'>
        <ExploreMenuItem current={inSection(location, '$')} />
        <QueueMenuItem
          current={inSection(location, 'queue')}
          totalItems={trackIds.length}
        />
        <SearchMenuItem
          current={inSection(location, 'search-results')}
          totalItems={props.collection.searchResults.length}
        />
        <PlaylistsMenuItem current={inSection(location, 'playlists')} totalItems={props.playlist.playlists.length} />
        <CollectionMenuItem
          collection={props.collection}
          current={inSection(location, '(collection.*)')}
          totalItems={props.collection.totalRows}
        />
        <ArtistsMenuItem
          current={inSection(location, 'artists')}
          totalItems={Object.keys(props.collection.artists).length}
        />
        <MenuItem
          current={inSection(location, 'providers')}
          url='/providers'
          title='Providers'
          label='Providers'
          icon={<Icon icon='faPlug' />}
        />
        <SettingsMenuItem current={inSection(location, 'settings')} />
      </ul>

      <CommandBar dispatch={props.dispatch} />

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
          {props.app.version}
        </a>
      </section>
    </div>
  )
}

export default SidebarContents
