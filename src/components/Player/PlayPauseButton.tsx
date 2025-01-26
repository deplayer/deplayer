import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  playing: boolean,
  onClick: () => void
}

const PlayPauseButton = (props: Props) => {
  return (
    <React.Fragment>
      <Button
        transparent
        inverted
        size='4xl'
        roundedFull
        className='text-primary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'
        onClick={props.onClick}
      >
        {props.playing ? <Icon icon='faPauseCircle' /> : <Icon icon='faPlayCircle' />}
      </Button>
    </React.Fragment>
  )
}

export default PlayPauseButton
