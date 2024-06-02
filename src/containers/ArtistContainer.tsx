import { connect } from 'react-redux'
import { useParams, Params } from 'react-router-dom'
import { State as CollectionState } from '../reducers/collection'

import ArtistView from '../components/ArtistView'

const getArtist = (params: Params, collection: CollectionState) => {
  const artistId = params.id || ''
  if (collection.artists[artistId]) {
    return collection.artists[artistId]
  }

  return null
}

const getSongsByArtist = (params: Params, collection: CollectionState) => {
  const artistId = params.id || ''
  if (collection.songsByArtist[artistId]) {
    return collection.songsByArtist[artistId]
  }

  return null
}

const getAlbumsByArtist = (params: Params, collection: CollectionState) => {
  const artistId = params.id || ''
  if (collection.albumsByArtist[artistId]) {
    return collection.albumsByArtist[artistId]
  }

  return null
}

const ArtistsContainer = (props: any) => {
  const params = useParams()
  const artist = getArtist(params, props.collection)
  const songs = getSongsByArtist(params, props.collection)
  const albumsByArtist = getAlbumsByArtist(params, props.collection)

  return (
    <ArtistView {...props} artist={artist} songs={songs} albumsByArtist={albumsByArtist} />
  )
}

export default connect(
  (state: any) => {
    return {
      artistMetadata: state.artist.artistMetadata,
      songsByAlbum: state.collection.songsByAlbum,
      backgroundImage: state.app.backgroundImage,
      albums: state.collection.albums,
      collection: state.collection,
      queue: state.queue,
    }
  }
)(ArtistsContainer)
