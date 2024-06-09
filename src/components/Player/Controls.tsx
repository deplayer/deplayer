import PlayPauseButton from './PlayPauseButton'
import SkipButton from './SkipButton'

type ControlProps = {
  playPrev: () => void,
  isPlaying: boolean,
  mqlMatch: boolean,
  playPause: () => void,
  playNext: () => void,
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
    </>
  )
}

export default Controls
