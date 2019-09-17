import * as React from 'react'
import { Dispatch } from 'redux'

import PlayPauseButton from './PlayPauseButton'
import ShuffleButton from './ShuffleButton'
import RepeatButton from './RepeatButton'
import SkipButton from './SkipButton'
import VolumeControl from './VolumeControl'

type ControlProps = {
  playPrev: () => void,
  isPlaying: boolean,
  playPause: () => void,
  playNext: () => void,
  volume: number,
  setVolume: (string) => void,
  dispatch: Dispatch
}

const Controls = (props: ControlProps) => {
  return (
    <div className='ui icon buttons player-controls'>
      <SkipButton
        onClick={props.playPrev}
        keyValues={['ArrowLeft', 'k']}
        type="prev"
      />
      <PlayPauseButton
        playing={props.isPlaying}
        onClick={props.playPause}
      />
      <SkipButton
        onClick={props.playNext}
        keyValues={['ArrowRight', 'j']}
        type="next"
      />
      <VolumeControl
        volume={ props.volume }
        onChange={props.setVolume}
      />
      <ShuffleButton
        dispatch={props.dispatch}
      />
      <RepeatButton
        dispatch={props.dispatch}
      />
    </div>
  )
}

export default Controls
