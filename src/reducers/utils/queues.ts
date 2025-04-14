// Get sibling songs ids to know which is the next and prev song
export const getSiblingSong = (trackIds: Array<string>, song: string, next = false): string | null => {
  if (!trackIds || !song || trackIds.length === 0) {
    return null;
  }

  const position = trackIds.indexOf(song);
  if (position === -1) {
    return null;
  }

  const nextIndex = position + (next ? 1 : -1);
  return trackIds[nextIndex] || null;
}

const extractField = (song: any, field: any) => {
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
