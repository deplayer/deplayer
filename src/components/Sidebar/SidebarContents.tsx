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
import ThemeModal from './ThemeModal'

import { inSection } from '../../utils/router'
import Icon from '../common/Icon'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { State as AppState } from '../../reducers/app'
import { State as PlaylistsState } from '../../reducers/playlist'
import { useLocation } from 'react-router'
import DeplayerTitle from '../DeplayerTitle'

type ContentProps = {
  dispatch: Dispatch,
  collection: CollectionState,
  queue: QueueState,
  app: AppState,
  playlist: PlaylistsState,
  onSetSidebarOpen: Function
}

function getInitialTheme() {
  return localStorage.getItem('theme') || 'dark'
}

const SwitchThemeButton = () => {
  const [theme, setTheme] = React.useState(getInitialTheme())
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <>
      <div className="absolute right-1 top-2 z-50">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost btn-circle">
          <Icon icon='faMoon' className='text-lg' />
        </button>
      </div>
      <ThemeModal 
        theme={theme} 
        setTheme={setTheme} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}

const SidebarContents = (props: ContentProps) => {
  const location = useLocation()
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds

  return (
    <div className='flex flex-col h-full bg-base-100' onClick={() => props.onSetSidebarOpen(true)}>
      <SwitchThemeButton />
      <h4 className="text-xl text-center py-4 bg-base-200 text-primary tracking-wider select-none">
        <DeplayerTitle />
      </h4>
      <ul className='menu menu-lg w-full flex-1 overflow-y-auto'>
        <ExploreMenuItem current={inSection(location, '$')} />
        <QueueMenuItem
          current={inSection(location, 'queue')}
          totalItems={trackIds.length}
        />
        <SearchMenuItem
          current={inSection(location, 'search-results')}
          totalItems={props.collection.searchResults.length}
        />
        <PlaylistsMenuItem 
          current={inSection(location, 'playlists')} 
          totalItems={props.playlist.playlists.length} 
        />
        <CollectionMenuItem
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

      <section className='p-6 pt-8 text-sm text-center w-full text-base-content/70'>
        <DeplayerTitle /> is 
        <a
          href={'https://gitlab.com/deplayer/deplayer'}
          rel="noreferrer"
          title="Show me the code"
          target="_blank"
          className="link link-primary mx-1"
        >
          open source!
        </a>
        <Icon icon='faGitlab' className='ml-2' />
      </section>
    </div>
  )
}

export default SidebarContents
