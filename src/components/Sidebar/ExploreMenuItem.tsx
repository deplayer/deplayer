import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: Boolean
}

const ExploreMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/'
      title='explore'
      label='Explore'
      icon={<Icon icon='faGlobe' />}
    >
    </MenuItem>
  )
}

export default ExploreMenuItem
