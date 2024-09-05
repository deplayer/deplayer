import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const SidebarButton = ({ dispatch }: Props) => {
  const toggleSidebar = () => {
    dispatch({ type: types.TOGGLE_SIDEBAR })
  }

  return (
    <Button
      transparent
      inverted
      onClick={toggleSidebar}
    >
      <Icon icon='faBars' />
    </Button>
  )
}

export default connect()(SidebarButton)
