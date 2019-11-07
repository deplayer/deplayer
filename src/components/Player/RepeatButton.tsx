import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { REPEAT } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch
}

const RepeatButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: REPEAT})
  }

  return (
    <Button
      transparent
      onClick={onClick}
    >
      <i className='fa fa-repeat -mx-1'></i>
      <Translate value='buttons.repeat' />
    </Button>
  )
}

export default RepeatButton
