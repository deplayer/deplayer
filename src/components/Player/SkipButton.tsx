import * as React from 'react'

import Button from '../common/Button'

type Props = {
  onClick: () => void,
  type: string
}

const SkipButton = (props: Props) => {
  return (
    <React.Fragment>
      <Button
        transparent
        size='2xl'
        onClick={props.onClick}
      >
        <i className={`icon step ${ props.type === 'next' ? 'forward': 'backward'}`}></i>
      </Button>
    </React.Fragment>
  )
}

export default SkipButton
