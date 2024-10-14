import Media from '../entities/Media'

const rowToSong = (elem: any): Media => {
  const songPayload = {
    ...elem
  }

  return new Media(songPayload)
}

export default rowToSong
