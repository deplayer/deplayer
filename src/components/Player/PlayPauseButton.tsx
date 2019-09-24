import * as React from 'react'
import KeyHandler, {KEYPRESS} from 'react-key-handler'

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
      <button
        className='play-pause'
        onClick={props.onClick}
      >
        <i className={`icon ${props.playing ? 'pause': 'play'} circle`}></i>
      </button>
    </React.Fragment>
  )
}

export default PlayPauseButton
