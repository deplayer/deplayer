import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: boolean
}

const CollectionMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/collection'
      title="menu.collection"
      label="menu.collection"
      icon={<Icon icon='faDatabase' />}
      translate={true}
    />
  )
}

export default CollectionMenuItem
