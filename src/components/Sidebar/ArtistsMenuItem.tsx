import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  totalItems: number,
  current?: boolean
}

const ArtistsMenuItem = ({ totalItems, current = false }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/artists'
      title='menu.artists'
      label='menu.artists'
      translate={true}
      icon={<Icon icon='faMicrophoneAlt' />}
    />
  )
}

export default ArtistsMenuItem
