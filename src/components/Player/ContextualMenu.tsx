import 'react-contexify/ReactContexify.css';

import { Menu, useContextMenu, Item } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'
import { Dispatch } from 'redux'
import { useAppStore } from '../../stores/livestore/store'

import Button from '../common/Button'
import Icon from '../common/Icon'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'
import Controls from './Controls'
import { State as AppState } from '../../reducers/app'
import { State as PlayerState } from '../../reducers/player'
import { useQueue } from '../../stores/livestore/hooks'
import { toggleRepeatAction, toggleShuffleAction } from '../../stores/livestore/actions'
import PlayerRefService from '../../services/PlayerRefService'

const MENU_ID = 'context-menu-player'

type MenuProps = {
  app: AppState,
  player: PlayerState,
  dispatch: Dispatch,
  volume: number,
}

const ContextualMenu = (props: MenuProps) => {
  // Get queue and store from LiveStore
  const liveQueue = useQueue('default')
  const liveStore = useAppStore()
  
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
  
  const TogglePlayer = () => {
    return (
      <Button alignLeft transparent fullWidth onClick={() => props.dispatch({ type: types.HIDE_PLAYER })}>
        <Icon
          icon='faEyeSlash'
          className='mr-2'
        />
        <Translate value='buttons.hidePlayer' />
      </Button>
    )
  }

  const setVolume = (value: number | number[]) => {
    props.dispatch({ type: types.VOLUME_SET, value: value })
  }

  const animate = !props.player.playing && 'animate-ping'
  const base = 'absolute right-0 bottom-0 bg-primary hover:bg-primary/80 focus:bg-primary/90 focus:outline-none flex justify-center'
  const integratedClassnames = `${base} w-10 h-10 rounded-full text-2xl m-2 mb-2.5 bg-accent`
  const standaloneClassnames = `${base} w-20 h-20 rounded-full text-4xl m-6 shadow-lg bg-accent`

  const showFullscreen = props.player.playing
  const showVisibilityCons = false
  const showStartPlaying = trackIds.length && !props.player.playing

  const { show } = useContextMenu({
    id: MENU_ID,
  })

  function handleContextMenu(event: any) {
    show({
      event,
      props: {
        key: 'value'
      }
    })
  }

  const itemClasses = 'flex flex-col w-full'

  return (
    <React.Fragment>
      <button
        className={props.player.showPlayer ? integratedClassnames : standaloneClassnames}
        id={MENU_ID}
        style={{
          zIndex: 103,
        }}
        onClick={handleContextMenu}
      >
        <div className='flex justify-center items-center w-100 h-full'>
          <Icon
            icon='faCompactDisc'
            className={`absolute text-base-100 ${animate}`}
          />
          <Icon
            icon='faCompactDisc'
            className='text-accent'
          />
        </div>
      </button>
      <Menu
        id={MENU_ID}
        theme='dark'
        className='flex flex-col justify-items-stretch flex-grow bg-base-300 text-base-content rounded-lg shadow-lg'
        style={{ marginTop: props.player.showPlayer ? '-68px' : '-124px' }}
      >
        <VolumeControl
          volume={props.player.volume}
          onChange={setVolume}
        />
        {showVisibilityCons &&
          <>
            <Item className={itemClasses}>
              <TogglePlayer />
            </Item>
            <Item className={itemClasses}>
              <ToggleMiniQueueButton />
            </Item>
          </>
        }
        <Item className={itemClasses}>
          <AddNewMediaButton fullWidth />
        </Item>
        {showFullscreen &&
          <Item className={itemClasses}>
            <Button
              transparent
              alignLeft
              fullWidth
              onClick={() => props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
            >
              <div className='flex items-center w-full'>
                <Icon
                  icon='faExpand'
                  className='mr-2'
                />
                <Translate value='buttons.fullScreen' />
              </div>
            </Button>
          </Item>
        }
        <Item className={itemClasses}>
          <Button
            transparent
            alignLeft
            fullWidth
            onClick={() => props.dispatch({ type: types.TOGGLE_VISUALS })}
          >
            <div className='flex items-center justify-between w-full gap-2'>
              <div className='flex items-center'>
                <Icon
                  icon='faBahai'
                  className='mr-2'
                />
                <Translate value='buttons.toggleVisuals' />
              </div>
              <input
                type="checkbox"
                checked={props.app.showVisuals}
                readOnly
                className="toggle toggle-primary toggle-sm"
              />
            </div>
          </Button>
        </Item>
        <Item className={itemClasses}>
          <Button
            transparent
            alignLeft
            fullWidth
            onClick={() => props.dispatch({ type: types.TOGGLE_SPECTRUM })}
          >
            <div className='flex items-center justify-between w-full gap-2'>
              <div className='flex items-center'>
                <Icon
                  icon='faDeezer'
                  className='mr-2'
                />
                <Translate value='buttons.toggleSpectrum' />
              </div>
              <input
                type="checkbox"
                checked={props.app.showSpectrum}
                readOnly
                className="toggle toggle-primary toggle-sm"
              />
            </div>
          </Button>
        </Item>
        {trackIds.length && (
          <>
            <Item className={itemClasses}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={() => {
                  toggleShuffleAction(liveStore, !liveQueue?.shuffle)
                }}
              >
                <div className='flex items-center justify-between w-full gap-2'>
                  <div className='flex items-center'>
                    <Icon icon='faRandom' className='mr-2' />
                    <Translate value='buttons.shuffle' />
                  </div>
                  <input
                    type="checkbox"
                    checked={liveQueue?.shuffle || false}
                    readOnly
                    className="toggle toggle-primary toggle-sm"
                  />
                </div>
              </Button>
            </Item>
            <Item className={itemClasses}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={() => {
                  toggleRepeatAction(liveStore, !liveQueue?.repeat)
                }}
              >
                <div className='flex items-center justify-between w-full gap-2'>
                  <div className='flex items-center'>
                    <Icon icon='faRedo' className='mr-2' />
                    <Translate value='buttons.repeat' />
                  </div>
                  <input
                    type="checkbox"
                    checked={liveQueue?.repeat || false}
                    readOnly
                    className="toggle toggle-primary toggle-sm"
                  />
                </div>
              </Button>
            </Item>
          </>
        )}
        {(showStartPlaying && trackIds.length) &&
          <Item className={itemClasses}>
            <Button
              transparent
              alignLeft
              fullWidth
              onClick={() => props.dispatch({ type: types.PLAY_SONG, songId: trackIds[0] })}
            >
              <div className='flex items-center w-full'>
                <Icon
                  icon='faPlayCircle'
                  className='mr-2'
                />
                <Translate value='buttons.startPlaying' />
              </div>
            </Button>
          </Item>
        }

        {!props.player.showPlayer &&
          <Item>
            <div className='flex justify-center w-full my-4'>
              <Controls
              showFullscreen={showFullscreen}
              toggleFullscreen={() => props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
              playPrev={() => props.dispatch({ type: types.PLAY_PREV })}
              isPlaying={props.player.playing}
              mqlMatch={true}
              playPause={() => PlayerRefService.getInstance().toggle()}
              playNext={() => props.dispatch({ type: types.PLAY_NEXT })}
            />
            </div>
          </Item>
        }
      </Menu>
    </React.Fragment >
  )
}

export default ContextualMenu
