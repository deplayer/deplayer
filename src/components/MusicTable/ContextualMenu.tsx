import 'react-contexify/ReactContexify.css'

import type { Dispatch } from 'redux'
import { Menu, Item, useContextMenu, TriggerEvent } from 'react-contexify'

import { Translate } from 'react-redux-i18n'
import React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import Media from '../../entities/Media'
import { State as QueueState } from '../../reducers/queue'
import * as types from '../../constants/ActionTypes'

type MenuProps = {
  songsLength: number, // Used to re-render
  dispatch: Dispatch,
  disableAddButton?: boolean,
  queue?: QueueState,
  onClick: () => void,
  song: Media,
}

const ContextualMenu = (props: MenuProps) => {
  const { onClick, disableAddButton, song } = props

  const addToQueue = () => {
    props.dispatch({ type: types.ADD_TO_QUEUE, songs: [props.song] })
  }

  const removeFromQueue = () => {
    props.dispatch({ type: types.REMOVE_FROM_QUEUE, data: [props.song] })
  }

  const removeFromDatabase = () => {
    props.dispatch({ type: types.REMOVE_FROM_COLLECTION, data: [props.song] })
  }

  const { show } = useContextMenu({
    id: `context-menu-${song.id}`,
  })
  function handleContextMenu(event: TriggerEvent) {
    show({
      event
    })
  }

  return (
    <React.Fragment>
      <div onClick={handleContextMenu} onContextMenu={handleContextMenu} className='p-1 mx-1 float-right cursor-pointer'>
        <Icon icon='faEllipsisV' className='text-blue-400' />
      </div>
      <Menu id={`context-menu-${song.id}`} className='song-menu' theme='dark'>
        <Item>
          <Button
            fullWidth
            transparent
            alignLeft
            onClick={onClick}
          >
            <i className='icon play mr-2'></i>
            <Translate value='buttons.play' />
          </Button>
        </Item>
        {!disableAddButton && (
          <Item>
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={addToQueue}
            >
              <Icon
                icon='faPlusCircle'
                className='mr-2'
              />
              <Translate value='buttons.addToQueue' />
            </Button>
          </Item>
        )}

        {!disableAddButton && props.queue?.currentPlaying && (
          <Item>
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={() => {
                props.dispatch({ type: types.ADD_TO_QUEUE_NEXT, songs: [props.song] })
              }}
            >
              <Icon
                icon='faPlusCircle'
                className='mr-2'
              />
              <Translate value='buttons.addNext' />
            </Button>
          </Item>
        )}
        {disableAddButton &&
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

        <Item>
          <Button
            fullWidth
            transparent
            alignLeft
            onClick={removeFromDatabase}
          >
            <i className='icon remove mr-2'></i>
            <Translate value='buttons.removeFromCollection' />
          </Button>
        </Item>
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
