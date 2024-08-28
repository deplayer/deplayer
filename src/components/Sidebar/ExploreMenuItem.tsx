import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: Boolean
}

const ExploreMenuItem = ({ current = false }: Props) => {
  const children = current ? (
    <ul>
      <MenuItem
        title='social'
        label='Social'
        url='/social'
        icon={<Icon icon='faDatabase' />}
      />
    </ul>
  ) : null

  return (
    <MenuItem
      current={current}
      url='/'
      title='explore'
      label='Explore'
      icon={<Icon icon='faGlobe' />}
    >
      {children}
    </MenuItem>
  )
}

export default ExploreMenuItem
