import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
  label?: string
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
        className='mr-2'
      />
      {props.label || <Translate value='buttons.addNewMedia' />}
    </Button>
  )
}

export default connect()(AddNewMediaButton)
