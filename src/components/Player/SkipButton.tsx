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
      roundedFull
      onClick={props.onClick}
      className='text-primary'
    >

      {props.type === 'next' ? <Icon icon='faStepForward' /> : <Icon icon='faStepBackward' />}
    </Button>
  )
}

export default SkipButton
