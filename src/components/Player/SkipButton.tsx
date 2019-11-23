import KeyHandler, {KEYPRESS} from 'react-key-handler'
import * as React from 'react'

import Button from '../common/Button'

type Props = {
  onClick: () => void,
  type: string,
  keyValues: Array<string>,
}

const SkipButton = (props: Props) => {
  const keyHandlers = props.keyValues.map((keyValue) => {
    return (
      <KeyHandler
        key={keyValue}
        keyEventName={KEYPRESS}
        keyValue={keyValue}
        onKeyHandle={props.onClick}
      />
    )
  })
  return (
    <React.Fragment>
      { keyHandlers }
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
