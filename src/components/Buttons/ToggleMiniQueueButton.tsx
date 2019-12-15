import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import * as React from 'react'

import { TOGGLE_MINI_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  dispatch: Dispatch
}

const ToggleMiniQueue = (props: Props) => {
  const toggleMiniQueue = () => {
    props.dispatch({type: TOGGLE_MINI_QUEUE})
  }

  return (
    <Button
      transparent
      onClick={toggleMiniQueue}
    >
      <Icon
        icon='faEyeSlash'
        className='mx-2'
      />
      <Translate value='buttons.toggleMiniQueue' />
    </Button>
  )
}

export default connect()(ToggleMiniQueue)
