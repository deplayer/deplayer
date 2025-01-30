import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: boolean
}

const QueueMenuItem = ({ current = false, totalItems }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/queue'
      title='menu.queue'
      label='menu.queue'
      translate={true}
      icon={<Icon icon='faMusic' />}
    />
  )
}

export default QueueMenuItem
