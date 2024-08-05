import 'react-contexify/ReactContexify.css';

import { Menu, useContextMenu, Item } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'
import Controls from './Controls'
import { State as AppState } from '../../reducers/app'

const MENU_ID = 'context-menu-player'

type MenuProps = {
  app: AppState,
  player: any,
  queue: any,
  dispatch: (action: any) => void,
  volume: number,
}

const ContextualMenu = (props: MenuProps) => {
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

  const animations = !props.player.playing && 'pulse'
  const base = 'absolute right-0 bottom-0 bg-yellow-600 focus:bg-yellow-700 hover:bg-yellow-500 focus:outline-none flex justify-center'
  const integratedClassnames = `${base} w-10 h-10 rounded-full text-2xl m-2 mb-2.5`
  const standaloneClassnames = `${animations} ${base} w-20 h-20 rounded-full text-4xl m-6 shadow-outline`

  const showFullscreen = props.player.playing
  const showVisibilityCons = false
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds
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

  const itemClasses = 'flex flex-col w-full justify-stretch'

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
            className='text-blue-200'
          />
        </div>
      </button>
      <Menu
        id={MENU_ID}
        theme='dark'
        className='flex flex-col justify-items-stretch'
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
          <AddNewMediaButton />
        </Item>
        {showFullscreen &&
          <Item className={itemClasses}>
            <Button
              transparent
              alignLeft
              fullWidth
              onClick={() => props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
            >
              <Icon
                icon='faExpand'
                className='mr-2'
              />
              <Translate value='buttons.fullScreen' />
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
            <Icon
              icon='faBahai'
              className='mr-2'
            />
            <Translate className='w-full' value='buttons.toggleVisuals' />
            <Icon
              icon={props.app.showVisuals ? 'faCheckSquare' : 'faSquare'}
              className='ml-4'
            />
          </Button>
        </Item>
        <Item className={itemClasses}>
          <Button
            transparent
            alignLeft
            fullWidth
            onClick={() => props.dispatch({ type: types.TOGGLE_SPECTRUM })}
          >
            <Icon
              icon='faDeezer'
              className='mr-2'
            />
            <Translate className='w-full' value='buttons.toggleSpectrum' />
            <Icon
              icon={props.app.showSpectrum ? 'faCheckSquare' : 'faSquare'}
              className='ml-4'
            />
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
                  props.dispatch({ type: types.SHUFFLE })
                }}
              >
                <Icon icon='faRandom' className='mr-2' />
                <Translate className='w-full' value='buttons.shuffle' />
                <Icon
                  icon={props.queue.shuffle ? 'faCheckSquare' : 'faSquare'}
                  className='ml-4'
                />
              </Button>
            </Item>
            <Item className={itemClasses}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={() => {
                  props.dispatch({ type: types.REPEAT })
                }}
              >
                <Icon icon='faRedo' className='mr-2' />
                <Translate className='w-full' value='buttons.repeat' />
                <Icon
                  icon={props.queue.repeat ? 'faCheckSquare' : 'faSquare'}
                  className='ml-4'
                />
              </Button>
            </Item>
          </>
        )}
        {showStartPlaying &&
          <Item className={itemClasses}>
            <Button
              transparent
              alignLeft
              fullWidth
              onClick={() => props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: trackIds[0] })}
            >
              <Icon
                icon='faPlayCircle'
                className='mr-2'
              />
              <Translate value='buttons.startPlaying' />
            </Button>
          </Item>
        }

        <Item>
          <div className='flex justify-center w-full my-4'>
            <Controls
              playPrev={() => props.dispatch({ type: types.PLAY_PREV })}
              isPlaying={props.player.playing}
              mqlMatch={true}
              playPause={() => props.dispatch({ type: types.TOGGLE_PLAYING })}
              playNext={() => props.dispatch({ type: types.PLAY_NEXT })}
            />
          </div>
        </Item>
      </Menu>
    </React.Fragment >
  )
}

export default ContextualMenu
