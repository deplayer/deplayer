import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  onClick: () => void,
  type: string
}

const SkipButton = (props: Props) => {
  return (
    <div className='hover:border-primary p-1 bg-base-300 hover:bg-base-800 rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
      <Button
        inverted
        transparent
        size='lg'
        className='w-12 h-10 bg-base-content/40 hover:bg-base-content/80 rounded-full hover:text-secondary-focus text-secondary'
        onClick={props.onClick}
      >
        {props.type === 'next' ? <Icon icon='faStepForward' /> : <Icon icon='faStepBackward' />}
      </Button>
    </div>
  )
}

export default SkipButton
