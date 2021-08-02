import * as React from 'react'
import { connect } from 'react-redux'
import KeyHandler, {KEYPRESS, KEYUP} from 'react-key-handler'
import * as types from '../constants/ActionTypes'

type Props = {
  dispatch: () => void
}


const GlobalKeyHandlers = (props: Props) => {
  return (
    <>
      <KeyHandler
        keyEventName={KEYUP}
        keyValue="m"
        onKeyHandle={() => props.dispatch({ type: types.VOLUME_SET, value: 0 })}
      />
    </>
  )
}

export default connect()(GlobalKeyHandlers)
