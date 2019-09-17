import * as React from 'react'

import Playlist from './Playlist'
import BodyMessage from '../BodyMessage'

type Props = {
  playlist: any,
  collection: any,
  dispatch: any
}

const Playlists = (props: Props) => {
  const { collection } = props
  const { playlists } = props.playlist

  if (!playlists.length) {
    return (
      <React.Fragment>
        <BodyMessage message={'Add songs to now playing and save it as playlist'} />
      </React.Fragment>
    )
  }


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
