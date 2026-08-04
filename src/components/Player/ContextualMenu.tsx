import 'react-contexify/ReactContexify.css';

import { Menu, useContextMenu, Item } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAppStore } from '../../stores/livestore/store'
import { useUIStore } from '../../stores/uiStore'

import Button from '../common/Button'
import Icon from '../common/Icon'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'
import Controls from './Controls'
import { State } from '../../reducers'
import { useQueue } from '../../stores/livestore/hooks'
import { getActiveTrackIds } from '../../stores/livestore/hooks/queueUtils'
import { toggleRepeatAction, toggleShuffleAction } from '../../stores/livestore/actions'

const MENU_ID = 'context-menu-player'

// Extracted from ContextualMenu to avoid nested component definition
const TogglePlayer = ({ onHide }: { onHide: () => void }) => {
  return (
    <Button alignLeft transparent fullWidth onClick={onHide}>
      <Icon icon='faEyeSlash' className='mr-2' />
      <Translate value='buttons.hidePlayer' />
    </Button>
  )
}

const ContextualMenu = () => {
  const visualsMode = useUIStore((s) => s.visualsMode)
  const showSpectrum = useUIStore((s) => s.showSpectrum)
  const cycleVisualsMode = useUIStore((s) => s.cycleVisualsMode)
  const toggleSpectrum = useUIStore((s) => s.toggleSpectrum)
  const player = useSelector((state: State) => state.player)
  const dispatch = useDispatch()
  // Get queue and store from LiveStore
  const liveQueue = useQueue('default')
  const liveStore = useAppStore()
  
  const trackIds = getActiveTrackIds(liveQueue)

  const setVolume = (value: number | number[]) => {
    dispatch({ type: types.VOLUME_SET, value: value })
  }

  const animate = !player.playing && 'animate-ping'
  const base = 'absolute right-0 bottom-0 bg-primary hover:bg-primary/80 focus:bg-primary/90 focus:outline-none flex justify-center'
  const integratedClassnames = `${base} w-10 h-10 rounded-full text-2xl m-2 mb-2.5 bg-accent`
  const standaloneClassnames = `${base} w-20 h-20 rounded-full text-4xl m-6 shadow-lg bg-accent`

  const showFullscreen = player.playing
  const showVisibilityCons = false
  const showStartPlaying = trackIds.length && !player.playing

  const { show } = useContextMenu({
    id: MENU_ID,
  })

  function handleContextMenu(event: React.MouseEvent) {
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
        className={player.showPlayer ? integratedClassnames : standaloneClassnames}
        id={MENU_ID}
        style={{
          zIndex: 103,
        }}
        onClick={handleContextMenu}
        aria-label="Player menu"
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
        style={{ marginTop: player.showPlayer ? '-68px' : '-124px' }}
      >
        <VolumeControl
          volume={player.volume}
          onChange={setVolume}
        />
        {showVisibilityCons &&
          <>
            <Item className={itemClasses}>
              <TogglePlayer onHide={() => dispatch({ type: types.HIDE_PLAYER })} />
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
              onClick={() => dispatch({ type: types.TOGGLE_FULL_SCREEN })}
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
            onClick={() => cycleVisualsMode()}
          >
            <div className='flex items-center justify-between w-full gap-2'>
              <div className='flex items-center'>
                <Icon
                  icon='faBahai'
                  className='mr-2'
                />
                <Translate value='buttons.toggleVisuals' />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                visualsMode === 'off' ? 'bg-base-300 text-base-content/50' :
                visualsMode === 'ambient' ? 'bg-primary/20 text-primary' :
                'bg-accent/20 text-accent'
              }`}>
                <Translate value={
                  visualsMode === 'off' ? 'buttons.visualizerOff' :
                  visualsMode === 'ambient' ? 'buttons.visualizerAmbient' :
                  'buttons.visualizerPanel'
                } />
              </span>
            </div>
          </Button>
        </Item>
        <Item className={itemClasses}>
          <Button
            transparent
            alignLeft
            fullWidth
            onClick={() => toggleSpectrum()}
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
                checked={showSpectrum}
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
              onClick={() => dispatch({ type: types.PLAY_SONG, songId: trackIds[0] })}
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

        {!player.showPlayer &&
          <Item>
            <div className='flex justify-center w-full my-4'>
              <Controls
              showFullscreen={showFullscreen}
              toggleFullscreen={() => dispatch({ type: types.TOGGLE_FULL_SCREEN })}
              playPrev={() => dispatch({ type: types.PLAY_PREV })}
              isPlaying={player.playing}
              mqlMatch={true}
              playPause={() => dispatch({ type: types.PLAYBACK_TOGGLE_REQUESTED })}
              playNext={() => dispatch({ type: types.PLAY_NEXT })}
            />
            </div>
          </Item>
        }
      </Menu>
    </React.Fragment >
  )
}

export default ContextualMenu
