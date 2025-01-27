import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'

import { ADD_TO_QUEUE_NEXT } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Media from '../../entities/Media'

type Props = {
  dispatch: Dispatch,
  songs?: Media[],
  transparent?: boolean,
  fullWidth?: boolean,
  alignLeft?: boolean,
  className?: string,
}

const PlayNextButton = (props: Props) => {
  const location = useLocation()
  const { dispatch, songs, transparent = true, fullWidth = false, alignLeft = false, className = '' } = props

  const playNext = () => {
    if (songs && songs.length > 0) {
      // If songs are provided directly, use them
      dispatch({ type: ADD_TO_QUEUE_NEXT, songs })
    } else {
      // Otherwise use the current path to get songs (similar to PlayAllButton)
      const path = location.pathname === '/' ? 'collection' : location.pathname.replace(/^\//, '')
      dispatch({ type: ADD_TO_QUEUE_NEXT, path })
    }
  }

  if (location.pathname === '/settings') {
    return null
  }

  return (
    <Button
      transparent={transparent}
      fullWidth={fullWidth}
      alignLeft={alignLeft}
      className={`play-next-button ${className}`}
      onClick={playNext}
    >
      <Icon icon='faPlusCircle' className='mr-2' />
      <Translate value='buttons.addNext' />
    </Button>
  )
}

const RoutedButton = (props: any) => <PlayNextButton {...props} />

export default RoutedButton 