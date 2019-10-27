import KeyHandler, {KEYPRESS} from 'react-key-handler'
import * as React from 'react'

import Button from '../common/Button'

type Props = {
  playing: boolean,
  onClick: () => void
}

const PlayPauseButton = (props: Props) => {
  return (
    <React.Fragment>
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue=" "
        onKeyHandle={props.onClick}
      />
      <Button
        className='play-pause'
        onClick={props.onClick}
      >
        <i className={`icon ${props.playing ? 'pause': 'play'} circle`}></i>
      </Button>
    </React.Fragment>
  )
}

export default PlayPauseButton
