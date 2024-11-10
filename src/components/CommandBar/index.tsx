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
        dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
      }
    }, {
      id: 2,
      color: '#fff',
      name: "Toggle visuals",
      command() {
        dispatch({ type: types.TOGGLE_VISUALS })
      }
    },
    {
      id: 3,
      color: '#fff',
      name: "Toggle spectrum",
      command() {
        dispatch({ type: types.TOGGLE_SPECTRUM })
      }
    }
  ]

  const trigger = "command bar"

  return (
    <div className='absolute mt-5'>
      <CommandPalette commands={commands} trigger={trigger} />
    </div>
  )
}

export default CommandBar
