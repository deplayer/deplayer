import { connect } from 'react-redux'

import AlbumView from '../components/AlbumView'

export default connect(
  (state: any, _ownProps: any) => ({
    songsByAlbum: state.collection.songsByAlbum,
    backgroundImage: state.app.backgroundImage,
    albums: state.collection.albums,
    collection: state.collection,
    queue: state.queue,
  })
)(AlbumView)
