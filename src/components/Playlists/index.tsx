import * as React from 'react'

import Playlist from './Playlist'

type Props = {
  playlist: any,
  collection: any,
  dispatch: any
}

const Playlists = (props: Props) => {
  const { collection } = props
  const { playlists } = props.playlist

  const playlistsComps = playlists.map((playlist) => {
    return (
      <Playlist
        dispatch={props.dispatch}
        key={playlist._id}
        collection={collection}
        playlist={playlist}
      />
    )
  })


  return (
    <div className='playlists'>
      { playlistsComps }
    </div>
  )
}

export default Playlists
