import MenuItem from './MenuItem'
import Icon from '../common/Icon'

type Props = {
  current?: Boolean
}

const PlaylistsMenuItem = ({ current = false }: Props) => {
  return (
    <MenuItem
      current={current}
      url='/playlists'
      title='playlists'
      label='Playlists'
      icon={<Icon icon='faBookmark' />}
    />
  )
}

export default PlaylistsMenuItem
