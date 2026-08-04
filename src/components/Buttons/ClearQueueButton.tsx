import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'

import { CLEAR_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'
import { useQueue } from '../../stores/livestore/hooks'
import { getActiveTrackIds } from '../../stores/livestore/hooks/queueUtils'
import { useDispatch } from 'react-redux'

type Props = {
  className?: string
}

const ClearQueueButton = (props: Props) => {
  const dispatch = useDispatch<Dispatch>()
  const liveQueue = useQueue('default')
  
  const trackIds = getActiveTrackIds(liveQueue)
    
  if (trackIds.length === 0) {
    return null
  }

  const clearQueue = () => {
    dispatch({ type: CLEAR_QUEUE })
  }

  return (
    <Button
      transparent
      className={`clearqueue-button button ${props.className || ''}`}
      onClick={clearQueue}
    >
      <Icon icon='faTrash' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.clearQueue' />
    </Button>
  )
}

export default ClearQueueButton
