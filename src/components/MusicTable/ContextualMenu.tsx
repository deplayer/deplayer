import 'react-contexify/dist/ReactContexify.min.css'

import { Dispatch } from 'redux'
import { Menu, Item, MenuProvider, theme } from 'react-contexify'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import Song from '../../entities/Song'
import * as types from '../../constants/ActionTypes'

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
      <Menu id={`context-menu-${song.id}`} className='song-menu' theme={theme.dark}>
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
                alignLeft
                onClick={addToQueue}
              >
                <Icon
                  icon='faPlusCircle'
                  className='mx-2'
                />
                <Translate value='buttons.addToQueue' />
              </Button>
            </Item>
        }
        { disableAddButton &&
            <Item>
              <Button
                fullWidth
                transparent
                alignLeft
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
