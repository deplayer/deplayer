import { connect } from 'react-redux'

import AlbumView from '../components/AlbumView'
import {
  getAlbum,
  getSongsByAlbum
} from './RouteSelectors'

export default connect(
  (state: any, ownProps: any) => ({
    album: getAlbum(ownProps.match, state.collection),
    songs: getSongsByAlbum(ownProps.match, state.collection),
    songsByAlbum: state.collection.songsByAlbum,
    backgroundImage: state.app.backgroundImage,
    albums: state.collection.albums,
    collection: state.collection,
    queue: state.queue,
  })
)(AlbumView)
