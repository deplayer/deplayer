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

import LogoSvg from '../../logo.svg?react'

type ContentProps = {
  dispatch: Dispatch,
  collection: CollectionState,
  queue: QueueState,
  app: AppState,
  playlist: PlaylistsState,
  onSetSidebarOpen: Function
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'deplayer' : 'nord';
}

const SwitchThemeButton = () => {
  const [theme, setTheme] = React.useState(getInitialTheme())
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <>
      <div className="mr-2">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost btn-circle btn-sm">
          <Icon icon='faPalette' className='text-lg text-base-content/40' />
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

const DeplayerLogo = () => {
  return (
    <LogoSvg className="w-8 h-8 p-1 ml-2 text-primary" />
  )
}

const SidebarContents = (props: ContentProps) => {
  const location = useLocation()
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds

  return (
    <div className='flex flex-col h-full bg-base-100' onClick={() => props.onSetSidebarOpen(true)}>
      <div className="flex justify-between bg-base-200 border-b border-base-300 py-4">
        <DeplayerLogo />
        <h4 className="text-xl text-center text-primary tracking-wider select-none">
          <DeplayerTitle />
        </h4>
        <SwitchThemeButton />
      </div>
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

      <div className='w-full'>  
        <CommandBar />
      </div>

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
