import { Translate } from 'react-redux-i18n'
import { connect, Dispatch } from 'react-redux'
import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const AddNewMediaButton = (props: Props) => {
  const openModal = () => {
    props.dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
  }

  return (
    <Button
      transparent
      onClick={openModal}
    >
      <Icon
        icon='faPlusCircle'
        className='mx-2'
      />
      <Translate value='buttons.addNewMedia' />
    </Button>
  )
}

export default connect()(AddNewMediaButton)
