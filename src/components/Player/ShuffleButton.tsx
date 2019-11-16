import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { SHUFFLE } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch
}

const ShuffleButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: SHUFFLE})
  }

  return (
    <Button
      fullWidth
      transparent
      onClick={onClick}
    >
      <i className='fa fa-random mx-2'></i>
      <Translate value='buttons.shuffle' />
    </Button>
  )
}

export default ShuffleButton
