import { connect } from 'react-redux'

import ArtistView from '../components/ArtistView'

const getArtist = (match, collection) => {
  const artistId = match.params.id
  if (collection.artists[artistId]) {
    return collection.artists[artistId]
  }

  return null
}

const getSongsByArtist = (match, collection) => {
  const artistId = match.params.id
  if (collection.songsByArtist[artistId]) {
    return collection.songsByArtist[artistId]
  }

  return null
}

const getAlbumsByArtist = (match, collection) => {
  const artistId = match.params.id
  if (collection.albumsByArtist[artistId]) {
    return collection.albumsByArtist[artistId]
  }

  return null
}

export default connect(
  (state: any, ownProps: any) => ({
    artistMetadata: state.artist.artistMetadata,
    artist: getArtist(ownProps.match, state.collection),
    songs: getSongsByArtist(ownProps.match, state.collection),
    songsByAlbum: state.collection.songsByAlbum,
    albumsByArtist: getAlbumsByArtist(ownProps.match, state.collection),
    backgroundImage: state.app.backgroundImage,
    albums: state.collection.albums,
    collection: state.collection,
    queue: state.queue,
  })
)(ArtistView)
