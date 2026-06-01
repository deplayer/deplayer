import { Translate } from 'react-redux-i18n'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { useUIStore } from '../../stores/uiStore'

type Props = {
  fullWidth?: boolean
  label?: string
  className?: string
}

const AddNewMediaButton = (props: Props) => {
  const setShowAddMediaModal = useUIStore((s) => s.setShowAddMediaModal)
  const openModal = () => setShowAddMediaModal(true)

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
