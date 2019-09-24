import KeyHandler, {KEYPRESS} from 'react-key-handler'
import * as React from 'react'

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
      <button
        onClick={props.onClick}
      >
        <i className={`icon step ${ props.type === 'next' ? 'forward': 'backward'}`}></i>
      </button>
    </React.Fragment>
  )
}

export default SkipButton
