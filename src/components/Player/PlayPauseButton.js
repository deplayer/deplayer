// @flow

import React from 'react'

type Props = {
  playing: boolean,
  onClick: () => void
}

const PlayPauseButton = (props: Props) => {
  return (
    <button
      className='play-pause'
      onClick={props.onClick}
    >
      <i className={`icon ${props.playing ? 'pause': 'play'} circle`}></i>
    </button>
  )
}

export default PlayPauseButton
