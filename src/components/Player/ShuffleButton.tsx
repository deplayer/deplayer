import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { SHUFFLE } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

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
      alignLeft
      onClick={onClick}
    >
      <Icon icon='faRandom' className='mx-2' />
      <Translate value='buttons.shuffle' />
    </Button>
  )
}

export default ShuffleButton
