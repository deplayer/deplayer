import Button from '../common/Button'
import Icon from '../common/Icon'
import FullscreenButton from './FullscreenButton'
import { useDispatch } from 'react-redux'

type ControlProps = {
  playPrev: () => void,
  isPlaying: boolean,
  mqlMatch: boolean,
  playPause: () => void,
  playNext: () => void,
  showFullscreen: boolean,
  toggleFullscreen: () => void,
}

const Controls = (props: ControlProps) => {
  const dispatch = useDispatch()

  return (
    <>
      {props.mqlMatch &&
        <div className='hover:border-primary p-1 bg-base-300 hover:bg-base-800 rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
          <Button
            inverted
            transparent
            size='lg'
            className='w-12 h-10 bg-base-content/40 hover:bg-base-content/80 rounded-full hover:text-secondary-focus text-secondary'
            onClick={props.playPrev}
          >
            <Icon icon='faStepBackward' />
          </Button>
        </div>
      }
      <div className='hover:border-primary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
        <Button
          transparent
          inverted
          size='4xl'
          roundedFull
          className='hover:bg-secondary-content hover:text-secondary text-primary-content bg-secondary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)] mx-1 w-14 h-14 p-0'
          onClick={props.playPause}
        >
          {props.isPlaying ? <Icon icon='faPauseCircle' /> : <Icon icon='faPlayCircle' />}
        </Button>
      </div>
      <div className='hover:border-primary p-1 bg-base-300 hover:bg-base-800 rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
        <Button
          inverted
          transparent
          size='lg'
          className='w-12 h-10 bg-base-content/40 hover:bg-base-content/80 rounded-full hover:text-secondary-focus text-secondary'
          onClick={props.playNext}
        >
          <Icon icon='faStepForward' />
        </Button>
      </div>
      { props.showFullscreen &&
        <FullscreenButton
          dispatch={dispatch}
          onClick={props.toggleFullscreen}
        />
      }
    </>
  )
}

export default Controls
