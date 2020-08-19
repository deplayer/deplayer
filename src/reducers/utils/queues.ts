// Get sibling songs ids to know which is the next and prev song
export const getSiblingSong = (trackIds: Array<string>, song: string, next = false) => {
  const tracksIndex = {}
  const position = trackIds.indexOf(song) ? trackIds.indexOf(song) : 0
  trackIds.forEach((trackId, index) => {
    tracksIndex[index] = trackId
  })

  if (next) {
    return tracksIndex[position+1]
  }

  return tracksIndex[position-1]
}

export const extractField = (song: any, field: any) => {
  return field.split('.').reduce((obj: any, i: number): any => {
    return obj[i] ? obj[i]: '0'
  }, song)
}

export const sortTrackIds = (tracks: any, field: string, direction: string = 'ASC') => {
  const songsIds = Object.keys(tracks)
  return songsIds.sort((songId1: string, songId2: string) => {
    const song1 = tracks[songId1]
    const song2 = tracks[songId2]
    const song1Field = extractField(song1, field)
    const song2Field = extractField(song2, field)

    if (song1Field < song2Field) {
      return direction === 'ASC' ? -1: 1
    }
    if (song1Field > song2Field) {
      return direction === 'DESC' ? 1: -1
    }

    return 0
  })
}
