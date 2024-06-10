import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: Boolean
}

const QueueMenuItem = ({ current = false, totalItems }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/queue'
      title='now playing'
      label='Now playing'
      icon={<Icon icon='faMusic' />}
    />
  )
}

export default QueueMenuItem
