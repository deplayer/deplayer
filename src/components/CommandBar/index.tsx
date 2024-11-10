import { Dispatch } from 'redux'
import CommandPalette, { Command } from 'react-command-palette'

import * as types from '../../constants/ActionTypes'
import './index.css'


interface Props {
  dispatch: Dispatch
}

function CommandBar({ dispatch }: Props) {
  const commands: Command[] = [
    {
      id: 1,
      color: '#fff',
      name: "Add new media",
      command() {
        return dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
      }
    }, {
      id: 2,
      color: '#fff',
      name: "Toggle visuals",
      command() {
        return dispatch({ type: types.TOGGLE_VISUALS })
      }
    },
    {
      id: 3,
      color: '#fff',
      name: "Toggle spectrum",
      command() {
        return dispatch({ type: types.TOGGLE_SPECTRUM })
      }
    }
  ]

  return (
    <div className='px-6 py-4 text-xs'>
      <CommandPalette commands={commands} closeOnSelect />
    </div>
  )
}

export default CommandBar
