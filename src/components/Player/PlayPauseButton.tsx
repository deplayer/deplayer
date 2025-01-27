import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  playing: boolean,
  onClick: () => void
}

const PlayPauseButton = (props: Props) => {
  return (
    <div className='hover:border-primary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)] mx-1'>
      <Button
        transparent
        inverted
        size='4xl'
        roundedFull
        className='hover:bg-secondary-content hover:text-secondary text-primary-content bg-secondary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)] mx-1 w-14 h-14 p-0'
        onClick={props.onClick}
      >
        {props.playing ? <Icon icon='faPauseCircle' /> : <Icon icon='faPlayCircle' />}
      </Button>
    </div>
  )
}

export default PlayPauseButton
