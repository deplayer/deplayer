import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: boolean
  totalItems: number
}

const PlaylistsMenuItem = ({ current = false, totalItems = 0 }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/playlists'
      title='menu.playlists'
      label='menu.playlists'
      translate={true}
      icon={<Icon icon='faBookmark' />}
    />
  )
}

export default PlaylistsMenuItem
