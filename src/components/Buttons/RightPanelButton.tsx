import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const RightPanelButton = ({ dispatch }: Props) => {
  const toggleRightPanel = () => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL, value: true })
  }

  return (
    <Button
      transparent
      inverted
      onClick={toggleRightPanel}
    >
      <Icon icon='faAddressBook' />
    </Button>
  )
}

export default connect()(RightPanelButton)
