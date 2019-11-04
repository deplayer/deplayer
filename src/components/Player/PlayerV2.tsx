import React from 'react'
import ReactPlayer from 'react-player'
import { Dispatch } from 'redux'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'

type Props = {
  queue: any,
  slim: boolean,
  player: PlayerState,
  settings: SettingsState,
  itemCount: number,
  collection: any,
  dispatch: Dispatch,
  match: any
}

class PlayerV2 extends React.Component<Props> {
  render () {
    return (
      <ReactPlayer
        id='player-audio'
        config={{ }}
        ref={this.ref}
        className='react-player'
        url={streamUri}
        pip={pip}
        playing={playing}
        controls={controls}
        light={light}
        loop={loop}
        playbackRate={playbackRate}
        volume={volume}
        muted={muted}
        onPlay={this.onPlay}
        onEnablePIP={this.onEnablePIP}
        onDisablePIP={this.onDisablePIP}
        onPause={this.onPause}
        onEnded={() => {
          this.saveTrackPlayed(currentPlayingId)
          this.playNext()
        }}
        onError={e => console.log('onError', e)}
        onProgress={this.onProgress}
        onDuration={this.onDuration}
        width={0}
        height={0}
      />
    )
  }
}

export default PlayerV2
