import { useStore } from '@livestore/react'
import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import { addNextAction } from '../../stores/livestore/actions'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Media from '../../entities/Media'

type Props = {
  songs?: Media[],
  mediaIds?: string[],
  transparent?: boolean,
  fullWidth?: boolean,
  alignLeft?: boolean,
  className?: string,
}

const PlayNextButton = (props: Props) => {
  const { store: liveStore } = useStore()
  const dispatch = useDispatch()
  const location = useLocation()
  const { songs, mediaIds, transparent = true, fullWidth = false, alignLeft = false, className = '' } = props

  const playNext = async () => {
    if (!liveStore) return
    
    try {
      let trackIds: string[] = []
      
      if (mediaIds && mediaIds.length > 0) {
        // Use provided media IDs directly
        trackIds = mediaIds
      } else if (songs && songs.length > 0) {
        // Extract IDs from Media objects
        trackIds = songs.map(s => s.id)
      } else {
        // Legacy: dispatch path-based action (will be handled by saga)
        const path = location.pathname === '/' ? 'collection' : location.pathname.replace(/^\//, '')
        dispatch({ type: types.ADD_TO_QUEUE_NEXT, path })
        return
      }
      
      if (trackIds.length > 0) {
        const firstTrackId = await addNextAction(liveStore, trackIds)
        
        // Dispatch to saga if needed to trigger playback
        if (firstTrackId) {
          dispatch({ 
            type: types.ADD_TO_QUEUE_NEXT_COMPLETED,
            trackId: firstTrackId 
          })
        }
      }
    } catch (error) {
      console.error('Failed to add next:', error)
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