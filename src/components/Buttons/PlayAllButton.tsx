import { I18n, Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import * as types from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  mediaIds?: string[]
  /** One-shot resolver for ALL matching ids (windowed collections). Wins over mediaIds. */
  resolveIds?: () => Promise<string[]>
  className?: string
}

const PlayAllButton = (props: Props) => {
  const dispatch = useDispatch()
  const location = useLocation()

  const playAll = async () => {
    // Windowed collections hand us a resolver so Play All keeps
    // whole-collection semantics instead of playing just the loaded window.
    const trackIds = props.resolveIds ? await props.resolveIds() : props.mediaIds
    if (trackIds && trackIds.length > 0) {
      dispatch({ type: types.PLAY_LIST, trackIds })
    }
  }

  if (location.pathname === '/settings') {
    return null
  }

  return (
    <Button
      transparent
      className={props.className}
      aria-label={I18n.t('buttons.playAll')}
      onClick={playAll}
    >
      <Icon icon='faCaretRight' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.playAll' />
    </Button>
  )
}

const RoutedButton = (props: Props) => <PlayAllButton {...props} />

export default RoutedButton
