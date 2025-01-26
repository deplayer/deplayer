import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  onClick: () => void,
  type: string
}

const SkipButton = (props: Props) => {
  return (
    <Button
      inverted
      transparent
      size='2xl'
      className='text-primary bg-primary-content rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'
      onClick={props.onClick}
    >
      {props.type === 'next' ? <Icon icon='faStepForward' /> : <Icon icon='faStepBackward' />}
    </Button>
  )
}

export default SkipButton
