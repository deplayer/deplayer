import { PathMatch } from "react-router"
import { State as CollectionState } from "../reducers/collection"

export const getAlbum = (match: PathMatch, collection: CollectionState) => {
  const albumId = match.params.id || ''
  if (collection.albums[albumId]) {
    return collection.albums[albumId]
  }

  return null
}

export const getSongsByAlbum = (match: PathMatch, collection: CollectionState) => {
  const albumId = match.params.id || ''
  if (collection.songsByAlbum[albumId]) {
    return collection.songsByAlbum[albumId]
  }

  return null
}

