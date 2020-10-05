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
        size='4xl'
        onClick={props.onClick}
      >
        { props.playing ? <Icon icon='faPauseCircle' /> : <Icon icon='faPlayCircle' /> }
      </Button>
    </React.Fragment>
  )
}

export default PlayPauseButton
