import * as React from 'react'

import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  onClick: () => void,
  type: string
}

const SkipButton = (props: Props) => {
  return (
    <React.Fragment>
      <Button
        inverted
        transparent
        size='2xl'
        onClick={props.onClick}
      >

        {props.type === 'next' ? <Icon icon='faStepForward' /> : <Icon icon='faStepBackward' />}
      </Button>
    </React.Fragment>
  )
}

export default SkipButton
