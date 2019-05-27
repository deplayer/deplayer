import * as React from 'react'

import MenuItem from './MenuItem'

type Props = {
  current?: Boolean
}

const PlaylistsMenuItem = ({current = false}: Props) => {
  return (
    <MenuItem
      current={current}
      url='/playlists'
      title='playlists'
      label='Playlists'
      iconClasses='fa fa-bookmark'
    />
  )
}

export default PlaylistsMenuItem
