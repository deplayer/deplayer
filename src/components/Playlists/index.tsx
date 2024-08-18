import * as React from 'react'

import Playlist from './Playlist'
import BodyMessage from '../BodyMessage'
import { State as CollectionState } from '../../reducers/collection'
import { State as PlaylistState } from '../../reducers/playlist'

type Props = {
  playlist: PlaylistState,
  collection: CollectionState,
  dispatch: any
}

const Playlists = (props: Props) => {
  const { collection } = props
  const { playlists } = props.playlist

  if (!playlists.length) {
    return (
      <React.Fragment>
        <BodyMessage message={`You don't have any playlist yet.\n Add some songs to now playing and save it as playlist`} />
      </React.Fragment>
    )
  }


  const playlistsComps = playlists.map((playlist: any) => {
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
    <div className='playlists z-10 flex flex-col w-full'>
      {playlistsComps}
    </div>
  )
}

export default Playlists
