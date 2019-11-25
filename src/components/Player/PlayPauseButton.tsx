import * as React from 'react'

import Button from '../common/Button'

type Props = {
  playing: boolean,
  onClick: () => void
}

const PlayPauseButton = (props: Props) => {
  return (
    <React.Fragment>
      <Button
        transparent
        size='4xl'
        onClick={props.onClick}
      >
        <i className={`icon ${props.playing ? 'pause': 'play'} circle`}></i>
      </Button>
    </React.Fragment>
  )
}

export default PlayPauseButton
