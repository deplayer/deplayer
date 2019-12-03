export const getAlbum = (match, collection) => {
  const albumId = match.params.id
  if (collection.albums[albumId]) {
    return collection.albums[albumId]
  }

  return null
}

export const getSongsByAlbum = (match, collection) => {
  const albumId = match.params.id
  if (collection.songsByAlbum[albumId]) {
    return collection.songsByAlbum[albumId]
  }

  return null
}

