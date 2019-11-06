import 'react-contexify/dist/ReactContexify.min.css'

import { Menu, Item, MenuProvider } from 'react-contexify'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import { ADD_TO_COLLECTION, REMOVE_FROM_COLLECTION } from '../../constants/ActionTypes'
import Song from '../../entities/Song';

type MenuProps = {
  dispatch: Dispatch,
  disableAddButton?: boolean,
  onClick: () => any,
  song: Song,
}

const ContextualMenu = (props: MenuProps) => {
  const { onClick, disableAddButton, song } = props

  const addToCollection = () => {
    props.dispatch({type: ADD_TO_COLLECTION, data: [props.song]})
  }

  const removeFromCollection = () => {
    props.dispatch({type: REMOVE_FROM_COLLECTION, data: [props.song]})
  }

  return (
    <React.Fragment>
      <MenuProvider event="onClick" id={`context-menu-${song.id}`} className='media-actions btn'>
        <i className='fa fa-ellipsis-v' />
      </MenuProvider>
      <Menu id={`context-menu-${song.id}`} className='song-menu'>
        <Item>
          <button
            className='play spaced'
            onClick={onClick}
          >
            <i className='icon play '></i>
            <Translate value='buttons.play' />
          </button>
        </Item>
        { !disableAddButton &&
            <Item>
              <button
                className='add-to-collection spaced'
                onClick={addToCollection}
              >
                <i className='icon add '></i>
                <Translate value='buttons.addToCollection' />
              </button>
            </Item>
        }
        { disableAddButton &&
            <Item>
              <button
                className='remove-from-collection spaced'
                onClick={removeFromCollection}
              >
                <i className='icon remove '></i>
                <Translate value='buttons.remove' />
              </button>
            </Item>
        }
      </Menu>
    </React.Fragment>
  )
}

export default ContextualMenu
