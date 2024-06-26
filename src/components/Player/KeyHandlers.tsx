import KeyHandler, { KEYPRESS, KEYUP } from 'react-key-handler'

type Props = {
  playPrev: () => void,
  playPause: () => void,
  playNext: () => void
}


const KeyHandlers = (props: Props) => {
  return (
    <>
      <KeyHandler
        keyEventName={KEYUP}
        keyValue=" "
        onKeyHandle={props.playPause}
      />
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue={'ArrowLeft'}
        onKeyHandle={props.playPrev}
      />
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue={'k'}
        onKeyHandle={props.playPrev}
      />
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue={'ArrowRight'}
        onKeyHandle={props.playNext}
      />
      <KeyHandler
        keyEventName={KEYPRESS}
        keyValue={'j'}
        onKeyHandle={props.playNext}
      />
    </>
  )
}

export default KeyHandlers
