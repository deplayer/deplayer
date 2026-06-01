import { Dispatch } from 'redux'
import React from 'react'
import { Translate, I18n } from 'react-redux-i18n'

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
import { useLocation } from 'react-router'
import { usePlaylists, useSmartPlaylists, useQueue, useMediaCount, useArtistsCount, useSearchMediaIds } from '../../stores/livestore/hooks'
import { useUIStore } from '../../stores/uiStore'

import LogoSvg from '../../logo.svg?react'
import PlayerRefService from '../../services/PlayerRefService'

type ContentProps = {
  dispatch: Dispatch,
  onSetSidebarOpen: Function,
  className?: string
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'deplayer' : 'nord';
}

const SwitchThemeButton = () => {
  const [theme, setTheme] = React.useState(() => getInitialTheme())
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <>
      <div className="mr-2">
        <button onClick={() => setIsModalOpen(true)} className="btn btn-ghost btn-circle btn-sm" aria-label="Change theme">
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
  
  // Get UI state from context
  const searchTerm = useUIStore(s => s.searchTerm)
  
  // Get playlists and queue from LiveStore
  const playlists = usePlaylists()
  const smartPlaylists = useSmartPlaylists()
  const totalPlaylists = playlists.length + smartPlaylists.length
  const liveQueue = useQueue('default')
  
  // Get collection counts from LiveStore - OPTIMIZED: count queries instead of full data
  const mediaCount = useMediaCount()
  const artistsCount = useArtistsCount()
  
  // Get search results count from LiveStore
  const searchResultIds = useSearchMediaIds(searchTerm, 1000)
  
  // Parse trackIds from LiveStore queue (can be JSON string or array)
  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }
  
  const trackIds = liveQueue?.shuffle 
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)

  return (
    <div role="button" tabIndex={0} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && props.onSetSidebarOpen) props.onSetSidebarOpen(true) }} className={`flex flex-col h-full bg-base-100 ${props.className || ''}`} onClick={() => props.onSetSidebarOpen(true)}>
      <div className="flex justify-between bg-base-200 border-b border-base-300 py-4">
        <DeplayerLogo />
        <h4 className="text-xl text-center text-primary tracking-wider select-none">
          <><span className='text-primary'>d</span><span className='text-base-content'>eplayer</span></>
        </h4>
        <SwitchThemeButton />
      </div>
      <ul className='menu menu-lg w-full flex-1 overflow-y-auto'>
        <ExploreMenuItem current={inSection(location, '$')} />
        {trackIds.length > 0 && (
          <QueueMenuItem
            current={inSection(location, 'queue')}
            totalItems={trackIds.length}
          />
        )}
        <SearchMenuItem
          current={inSection(location, 'search-results')}
          totalItems={searchResultIds.length}
        />
        <PlaylistsMenuItem 
          current={inSection(location, 'playlists')} 
          totalItems={totalPlaylists} 
        />
        <CollectionMenuItem
          current={inSection(location, 'collection')}
          totalItems={mediaCount}
        />
        {artistsCount > 0 && (
          <ArtistsMenuItem
            current={inSection(location, 'artists')}
            totalItems={artistsCount}
          />
        )}
        <MenuItem
          current={inSection(location, 'providers')}
          url='/providers'
          title="sidebar.providers"
          label="sidebar.providers"
          icon={<Icon icon='faPlug' />}
          translate={true}
        />
        <SettingsMenuItem current={inSection(location, 'settings')} />
      </ul>

      <div className='w-full'>  
        <CommandBar 
          togglePlaying={() => PlayerRefService.getInstance().toggle()}
          playNext={() => props.dispatch({ type: 'PLAY_NEXT' })}
          playPrev={() => props.dispatch({ type: 'PLAY_PREV' })}
        />
      </div>

      <section className='p-6 pt-8 text-sm text-center w-full text-base-content/70'>
        <><span className='text-primary'>d</span><span className='text-base-content'>eplayer</span></> <Translate value="sidebar.openSource" />
        <a
          href={'https://gitlab.com/deplayer/deplayer'}
          rel="noreferrer"
          title="sidebar.showCode"
          target="_blank"
          className="link link-primary mx-1"
        >
          <Translate value="sidebar.showCode" />
        </a>
        <Icon icon='faGitlab' className='mx-2' />
        <a href="https://path-to-localfirst.deplayer.app" target="_blank" className="link link-primary"><Translate value="labels.storyBehind" /></a> 
        <div className="mt-4">
          <a
            href="https://buymeacoffee.com/gtrias"
            rel="noreferrer"
            target="_blank"
            title={I18n.t('sidebar.supportProject')}
            className="btn btn-sm btn-ghost gap-2 hover:bg-yellow-500/10"
          >
            <Icon icon='faCoffee' className="text-yellow-500" />
            <span><Translate value="sidebar.buyMeACoffee" /></span>
          </a>
        </div>
      </section>
    </div>
  )
}

export default SidebarContents
