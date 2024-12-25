import PlayPauseButton from './PlayPauseButton'
import SkipButton from './SkipButton'
import FullscreenButton from './FullscreenButton'

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
  return (
    <>
      {props.mqlMatch &&
        <SkipButton
          onClick={props.playPrev}
          type="prev"
        />
      }
      <PlayPauseButton
        playing={props.isPlaying}
        onClick={props.playPause}
      />
      <SkipButton
        onClick={props.playNext}
        type="next"
      />
      { props.showFullscreen &&
        <FullscreenButton
          onClick={props.toggleFullscreen}
        />
      }
    </>
  )
}

export default Controls
