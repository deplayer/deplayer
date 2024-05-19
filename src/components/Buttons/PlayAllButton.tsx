import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'

import { PLAY_ALL } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  dispatch: Dispatch,
  location: any
}

const PlayAllButton = (props: Props) => {
  const playAll = () => {
    props.dispatch({ type: PLAY_ALL, path: props.location.pathname.replace(/\//, '') })
  }

  if (props.location.pathname.match(/^\/settings?$/)) {
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
