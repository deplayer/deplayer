// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : { providers: {} }
}

export const getState = (state: any) => {
  return state
}

export const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

export const getSmartPlaylists = (state: any): any => {
  return state ? state.playlist.smartPlaylists : {}
}

export const getCollection = (state: any): any => {
  return state ? state.collection : {}
}

export const getAlbumSongs = (state: any): any => {
  return state ? state.collection.songsByAlbum : {}
}

export const getApp = (state: any): any => {
  return state ? state.app : {}
}

export const getPlayer = (state: any): any => {
  return state ? state.player : {}
}

export const getSongBg = (state: any): any => {
  const { collection: { rows }, queue: { currentPlaying } } = state
  if (rows[currentPlaying]) {
    const song = rows[currentPlaying]
    return song.cover?.fullUrl
  }
  return ''
}

export const getCurrentSong = (state: any) => {
  if (!state) {
    return
  }

  const rows = state.collection.rows
  const currentId = state.queue.currentPlaying
  return rows[currentId]
}

export const getSongById = (state: any, id: string) => {
  return state.collection.rows[id]
}
