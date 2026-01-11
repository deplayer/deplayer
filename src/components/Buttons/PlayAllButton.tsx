import { useStore } from '@livestore/react'
import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import { playAllAction } from '../../stores/livestore/actions'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  mediaIds?: string[]
  className?: string
}

const PlayAllButton = (props: Props) => {
  const { store: liveStore } = useStore()
  const dispatch = useDispatch()
  const location = useLocation()
  
  const playAll = async () => {
    if (!liveStore) return
    
    try {
      let firstTrackId: string | null = null
      
      if (props.mediaIds && props.mediaIds.length > 0) {
        // Use provided media IDs
        firstTrackId = await playAllAction(liveStore, props.mediaIds)
      } else {
        // Legacy: dispatch path-based action (will be handled by saga)
        const path = location.pathname === '/' ? 'collection' : location.pathname.replace(/^\//, '')
        dispatch({ type: types.PLAY_ALL, path })
        return
      }
      
      // Dispatch to saga to trigger playback side effects
      if (firstTrackId) {
        dispatch({ 
          type: types.PLAY_ALL_COMPLETED,
          trackId: firstTrackId 
        })
      }
    } catch (error) {
      console.error('Failed to play all:', error)
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
