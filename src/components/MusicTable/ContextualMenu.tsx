import 'react-contexify/dist/ReactContexify.min.css'

import { Dispatch } from 'redux'
import { Menu, Item, MenuProvider } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import Song from '../../entities/Song'

type MenuProps = {
  dispatch: Dispatch,
  disableAddButton?: boolean,
  onClick: () => any,
  song: Song,
}

const ContextualMenu = (props: MenuProps) => {
  const { onClick, disableAddButton, song } = props

  const addToQueue = () => {
    props.dispatch({type: types.ADD_TO_QUEUE, song: [props.song]})
  }

  const removeFromQueue = () => {
    props.dispatch({type: types.REMOVE_FROM_QUEUE, data: [props.song]})
  }

  return (
    <React.Fragment>
      <MenuProvider event="onClick" id={`context-menu-${song.id}`}>
        <i className='fa fa-ellipsis-v p-1 mx-1 text-blue-400 cursor-pointer float-right' />
      </MenuProvider>
      <Menu id={`context-menu-${song.id}`} className='song-menu'>
        <Item>
          <Button
            fullWidth
            transparent
            onClick={onClick}
          >
            <i className='icon play mr-2'></i>
            <Translate value='buttons.play' />
          </Button>
        </Item>
        { !disableAddButton &&
            <Item>
              <Button
                fullWidth
                transparent
                onClick={addToQueue}
              >
                <i className='icon add mr-2'></i>
                <Translate value='buttons.addToQueue' />
              </Button>
            </Item>
        }
        { disableAddButton &&
            <Item>
              <Button
                fullWidth
                transparent
                onClick={removeFromQueue}
              >
                <i className='icon remove mr-2'></i>
                <Translate value='buttons.remove' />
              </Button>
            </Item>
        }
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
