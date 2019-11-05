import React from 'react'
import ReactPlayer from 'react-player'
import Props from './PlayerProps'

const PlayerV2 = (props: Props) => {
  return (
    <ReactPlayer
      id='player-audio'
      ref={props.ref}
      className='react-player'
      url={props.url}
      playing={props.playing}
      controls={false}
      light={false}
      loop={false}
      playbackRate={1}
      volume={props.volume}
      muted={false}
      onPlay={props.onPlay}
      onPause={props.onPause}
      onEnded={props.onEnded}
      config={{ }}
      onError={(e: Error) => console.log('onError', e)}
      onProgress={props.onProgress}
      onDuration={props.onDuration}
      width={0}
      height={0}
    />
  )
}

export default PlayerV2
