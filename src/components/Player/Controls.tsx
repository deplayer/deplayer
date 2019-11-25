import { Dispatch } from 'redux'
import * as React from 'react'

import KeyHandler, {KEYPRESS} from 'react-key-handler'
import PlayPauseButton from './PlayPauseButton'
import SkipButton from './SkipButton'

type ControlProps = {
  playPrev: () => void,
  isPlaying: boolean,
  mqlMatch: boolean,
  playPause: () => void,
  playNext: () => void,
  dispatch: Dispatch
}

const Controls = (props: ControlProps) => {
  return (
    <>
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue=" "
        onKeyHandle={props.playPause}
      />
      { props.mqlMatch &&
        <SkipButton
          onClick={props.playPrev}
          keyValues={['ArrowLeft', 'k']}
          type="prev"
        />
      }
      <PlayPauseButton
        playing={props.isPlaying}
        onClick={props.playPause}
      />
      <SkipButton
        onClick={props.playNext}
        keyValues={['ArrowRight', 'j']}
        type="next"
      />
    </>
  )
}

export default Controls
