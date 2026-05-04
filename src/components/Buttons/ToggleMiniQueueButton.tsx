import { useDispatch } from 'react-redux'
import { I18n } from 'react-redux-i18n'
import { TOGGLE_MINI_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

const ToggleMiniQueueButton = () => {
  const dispatch = useDispatch()
  const toggleMiniQueue = () => {
    dispatch({ type: TOGGLE_MINI_QUEUE })
  }

  return (
    <Button
      transparent
      onClick={toggleMiniQueue}
      title={I18n.t('buttons.toggleMiniQueue')}
    >
      <Icon icon='faEyeSlash' className='mx-2' />
    </Button>
  )
}

export default ToggleMiniQueueButton
