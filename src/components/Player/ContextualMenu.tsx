import 'react-contexify/dist/ReactContexify.min.css'

import { Menu, MenuProvider, Item, theme, animation } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import RepeatButton from './RepeatButton'
import ShuffleButton from './ShuffleButton'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'

type MenuProps = {
  player: any,
  queue: any,
  dispatch: any,
  volume: number,
}

const ContextualMenu = (props: MenuProps) => {
  const TogglePlayer = () => {
    return (
      <Button alignLeft transparent fullWidth onClick={() => props.dispatch({type: types.HIDE_PLAYER})}>
        <Icon
          icon='faEyeSlash'
          className='mx-2'
        />
        <Translate value='buttons.hidePlayer' />
      </Button>
    )
  }

  const setVolume = (value: number) => {
    props.dispatch({ type: types.VOLUME_SET, value: value })
  }

  const animations = !props.player.playing && 'pulse'
  const base = 'absolute right-0 bottom-0 bg-yellow-600 focus:bg-yellow-700 hover:bg-yellow-500 focus:outline-none flex justify-center'
  const integratedClassnames = `${base} w-10 h-10 rounded-full text-2xl m-4`
  const standaloneClassnames = `${animations} ${base} w-20 h-20 rounded-full text-4xl m-6 shadow-outline`

  const showExtraPlayerOps = props.player.showPlayer
  const showFullscreen = props.player.playing
  const showVisibilityCons = false
  const showStartPlaying = props.queue.trackIds.length && !props.player.playing

  return (
    <React.Fragment>
      <MenuProvider
        event="onClick"
        id='context-menu-player'
        style={{
          zIndex: 103,
        }}
      >
        <button
          className={props.player.showPlayer ? integratedClassnames : standaloneClassnames}
        >
          <div className='flex justify-center items-center w-full h-full'>
            <Icon
              icon='faCompactDisc'
              className='text-blue-200'
            />
          </div>
        </button>
      </MenuProvider>
      <Menu
        id='context-menu-player'
        style={{ marginTop: props.player.showPlayer ? '-68px' : '-124px'}}
        theme={theme.dark}
        animation={animation.fade}
      >
        <VolumeControl
          volume={ props.player.volume }
          onChange={setVolume}
        />
        { showExtraPlayerOps && (
          <>
            <Item className='flex w-full'>
              <ShuffleButton
                dispatch={props.dispatch}
              />
            </Item>
            <Item className='flex w-full'>
              <RepeatButton
                dispatch={props.dispatch}
              />
            </Item>
          </>
        )}
        { showStartPlaying &&
            <Item className='flex w-full'>
              <Button
                transparent
                alignLeft
                fullWidth
                onClick={() => props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: props.queue.trackIds[0] })}
              >
                <Icon
                  icon='faPlayCircle'
                  className='mx-2'
                />
                <Translate value='buttons.startPlaying' />
              </Button>
            </Item>
        }
        { showVisibilityCons &&
          <>
            <Item className='flex w-full'>
              <TogglePlayer />
            </Item>
            <Item className='flex w-full'>
              <ToggleMiniQueueButton />
            </Item>
          </>
        }
        <Item className='flex w-full'>
          <AddNewMediaButton />
        </Item>
        { showFullscreen &&
          <Item className='flex w-full'>
            <Button
              transparent
              alignLeft
              fullWidth
              onClick={() => props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
            >
              <Icon
                icon='faExpand'
                className='mx-2'
              />
              <Translate value='buttons.fullScreen' />
            </Button>
          </Item>
        }
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
