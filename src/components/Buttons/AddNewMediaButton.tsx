import { Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'
import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  fullWidth?: boolean
  label?: string
  className?: string
}

const AddNewMediaButton = (props: Props) => {
  const dispatch = useDispatch()
  const openModal = () => {
    dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
  }

  return (
    <Button
      onClick={openModal}
      fullWidth={props.fullWidth}
      className={`btn btn-secondary ${props.className || ''}`}
    >
      <Icon icon='faPlusCircle' className='mr-2' />
      {props.label || <Translate value='buttons.addNewMedia' />}
    </Button>
  )
}

export default AddNewMediaButton
