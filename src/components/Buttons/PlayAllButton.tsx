import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  mediaIds?: string[]
  className?: string
}

const PlayAllButton = (props: Props) => {
  const dispatch = useDispatch()
  const location = useLocation()

  const playAll = () => {
    if (props.mediaIds && props.mediaIds.length > 0) {
      dispatch({ type: types.PLAY_LIST, trackIds: props.mediaIds })
    } else {
      // Legacy: dispatch path-based action
      const path = location.pathname === '/' ? 'collection' : location.pathname.replace(/^\//, '')
      dispatch({ type: types.PLAY_ALL, path })
    }
  }

  if (location.pathname === '/settings') {
    return null
  }

  return (
    <Button
      transparent
      className={`playall-button button ${props.className || ''}`}
      onClick={playAll}
    >
      <Icon icon='faCaretRight' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.playAll' />
    </Button>
  )
}

const RoutedButton = (props: any) => <PlayAllButton {...props} />

export default RoutedButton
