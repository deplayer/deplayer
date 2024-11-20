import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const RightPanelButton = ({ dispatch }: Props) => {
  const toggleSidebar = () => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL })
  }

  return (
    <Button
      transparent
      inverted
      onClick={toggleSidebar}
    >
      <Icon icon='faAddressBook' />

    </Button>
  )
}

export default connect()(RightPanelButton)
