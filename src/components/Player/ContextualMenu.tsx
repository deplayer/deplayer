import 'react-contexify/dist/ReactContexify.min.css'

import { Menu, MenuProvider, Item, theme } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import RepeatButton from './RepeatButton'
import ShuffleButton from './ShuffleButton'
import ToggleMiniQueueButton from '../Buttons/ToggleMiniQueueButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'

type MenuProps = {
  dispatch: any,
  volume: number,
  setVolume: (value: number) => void
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

  return (
    <React.Fragment>
      <MenuProvider event="onClick" id='context-menu-player' className='w-8 m-2'>
        <Button transparent fullWidth>
          <i className='fa fa-ellipsis-v' />
        </Button>
      </MenuProvider>
      <Menu id='context-menu-player' theme={theme.dark}>
        <VolumeControl
          volume={ props.volume }
          onChange={props.setVolume}
        />
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
        <Item className='flex w-full'>
          <TogglePlayer />
        </Item>
        <Item className='flex w-full'>
          <ToggleMiniQueueButton />
        </Item>
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
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
