import { I18n } from 'react-redux-i18n'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { useUIStore } from '../../stores/uiStore'

const ToggleMiniQueueButton = () => {
  const toggleMiniQueue = useUIStore((s) => s.toggleMiniQueue)

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
