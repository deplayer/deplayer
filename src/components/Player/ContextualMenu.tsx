import 'react-contexify/dist/ReactContexify.min.css'

import { Menu, MenuProvider, Item } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import RepeatButton from './RepeatButton'
import ShuffleButton from './ShuffleButton'
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
      <Button transparent fullWidth onClick={() => props.dispatch({type: types.HIDE_PLAYER})}>
        <i className='fa fa-eye-slash mx-2'></i>
          <Translate value='buttons.hidePlayer' />
      </Button>
    )
  }

  return (
    <React.Fragment>
      <MenuProvider event="onClick" id='context-menu-player' className='w-8 m-4'>
        <Button transparent fullWidth>
          <i className='fa fa-ellipsis-v' />
        </Button>
      </MenuProvider>
      <Menu id='context-menu-player'>
        <Item className='w-full'>
          <VolumeControl
            volume={ props.volume }
            onChange={props.setVolume}
          />
        </Item>
        <Item>
          <ShuffleButton
            dispatch={props.dispatch}
          />
        </Item>
        <Item>
          <RepeatButton
            dispatch={props.dispatch}
          />
        </Item>
        <Item>
          <TogglePlayer />
        </Item>
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
