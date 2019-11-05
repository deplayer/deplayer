import * as React from 'react'
import { State as PlayerState } from '../../reducers/player'
import Props from './PlayerProps'

const Player = (props: Props) => {
  return (
    <audio
      id='player-audio'
      ref={props.ref}
      src={props.url}
      crossOrigin="anonymous"
      autoPlay={ props.playing }
      onTimeUpdate={ props.onTimeUpdate }
      onEnded={ props.onEnded }
    />
  )
}

export default Player
