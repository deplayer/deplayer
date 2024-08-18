import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: Boolean
  totalItems: number
}

const PlaylistsMenuItem = ({ current = false, totalItems = 0 }: Props) => {
  return (
    <MenuItem
      totalItems={totalItems}
      current={current}
      url='/playlists'
      title='playlists'
      label='Playlists'
      icon={<Icon icon='faBookmark' />}
    />
  )
}

export default PlaylistsMenuItem
