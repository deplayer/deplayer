import * as React from 'react'
import { State as PlayerState } from '../../reducers/player'

type Props = {
  ref: React.Ref<any>,
  streamUri: string,
  player: PlayerState,
  onEnded: () => void,
  onError: () => void,
  onTimeUpdate: () => void
}

const Player = (props: Props) => {
  return (
    <audio
      id='player-audio'
      ref={props.ref}
      src={props.streamUri}
      crossOrigin="anonymous"
      onError={() => props.onError()}
      autoPlay={ this.props.player.playing }
      onTimeUpdate={ props.onTimeUpdate }
      onEnded={ props.onEnded }
    />
  )
}

export default Player
