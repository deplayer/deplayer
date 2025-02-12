import Media, { IMedia } from '../entities/Media'
const rowToSong = (elem: IMedia): Media => {
  if (!elem) {
    throw new Error('Song data is undefined')
  }

  // Ensure we have the minimum required fields
  if (!elem.artistName) {
    elem.artistName = 'Unknown Artist'
  }

  // Ensure we have the artist object
  if (!elem.artist) {
    elem.artist = {
      name: elem.artistName,
      id: elem.artistId
    }
  }

  const songPayload = {
    ...elem
  }

  return new Media(songPayload)
}

export default rowToSong
