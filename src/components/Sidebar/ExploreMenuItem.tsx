import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: boolean
}

const ExploreMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/'
      title="menu.home"
      label="menu.home"
      icon={<Icon icon='faGlobe' />}
      translate={true}
    />
  )
}

export default ExploreMenuItem
