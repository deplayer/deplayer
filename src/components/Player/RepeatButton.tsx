import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { REPEAT } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  dispatch: Dispatch
}

const RepeatButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: REPEAT})
  }

  return (
    <Button
      fullWidth
      transparent
      alignLeft
      onClick={onClick}
    >
      <Icon icon='faRedo' className='mx-2' />
      <Translate value='buttons.repeat' />
    </Button>
  )
}

export default RepeatButton
