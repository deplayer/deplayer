import Playlist from './Playlist'
import CenteredMessage from '../common/CenteredMessage'
import { State as CollectionState } from '../../reducers/collection'
import { State as PlaylistState } from '../../reducers/playlist'

type Props = {
  playlist: PlaylistState,
  collection: CollectionState,
  dispatch: any
}

const Playlists = (props: Props) => {
  const { collection } = props
  const { playlists, smartPlaylists } = props.playlist

  if (!playlists.length && !smartPlaylists.length) {
    return (
      <CenteredMessage>
        <div className='text-center'>
          You don't have any playlist yet.
          <br />
          Add some songs to now playing and save it as playlist
        </div>
      </CenteredMessage>
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

  const smartPlaylistsComps = smartPlaylists.map((playlist: any) => {
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
    <div className='playlists z-10 flex flex-col w-full overflow-y-auto h-full'>
      {playlistsComps}
      {smartPlaylistsComps}
    </div>
  )
}

export default Playlists
