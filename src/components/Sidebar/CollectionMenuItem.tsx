import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: Boolean
}

const CollectionMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/collection'
      title='collection'
      label='Collection'
      icon={<Icon icon='faDatabase' />}
    />
  )
}

export default CollectionMenuItem
