import { Dispatch } from 'redux'
import * as React from 'react'

import Button from '../common/Button'
import PlayPauseButton from './PlayPauseButton'
import RepeatButton from './RepeatButton'
import ShuffleButton from './ShuffleButton'
import SkipButton from './SkipButton'
import VolumeControl from './VolumeControl'
import * as types from '../../constants/ActionTypes'

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
  const TogglePlayer = () => {
    return (
      <Button className='xs' onClick={() => props.dispatch({type: types.HIDE_PLAYER})}>
        <i className='fa fa-eye-slash'></i>
      </Button>
    )
  }

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
      <TogglePlayer />
    </div>
  )
}

export default Controls
