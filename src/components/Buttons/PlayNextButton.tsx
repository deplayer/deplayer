import { useAppStore } from '../../stores/livestore/store'
import { Translate } from 'react-redux-i18n'
import { useLocation } from 'react-router-dom'

import { addNextAction } from '../../stores/livestore/actions'
import Button from '../common/Button'
import Icon from '../common/Icon'
import type { MediaRow } from '../../types/media'

type Props = {
  songs?: MediaRow[],
  mediaIds?: string[],
  transparent?: boolean,
  fullWidth?: boolean,
  alignLeft?: boolean,
  className?: string,
}

const PlayNextButton = (props: Props) => {
  const liveStore = useAppStore()
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
      }

      if (trackIds.length > 0) {
        await addNextAction(liveStore, trackIds)
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

const RoutedButton = (props: Props) => <PlayNextButton {...props} />

export default RoutedButton