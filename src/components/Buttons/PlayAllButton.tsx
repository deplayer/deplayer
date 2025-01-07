import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'

import { PLAY_ALL } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  dispatch: Dispatch,
}

const PlayAllButton = (props: Props) => {
  const location = useLocation()
  const playAll = () => {
    const path = location.pathname === '/' ? 'collection' : location.pathname.replace(/^\//, '')
    props.dispatch({ type: PLAY_ALL, path })
  }

  if (location.pathname === '/settings') {
    return null
  }

  return (
    <Button
      transparent
      className='playall-button button'
      onClick={playAll}
    >
      <Icon icon='faCaretRight' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.playAll' />
    </Button>
  )
}

const RoutedButton = (props: any) => <PlayAllButton {...props} />

export default RoutedButton
