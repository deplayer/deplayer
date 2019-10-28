import Song from '../entities/Song'
import { RxDocument } from 'rxdb'

const rowToSong  = (elem: RxDocument<any, any>): Song => {
  const songPayload = {
    ...elem,
    ...{
      albumName: elem.album.name,
      artistName: elem.artist.name,
    }
  }

  if (elem.artist.id) {
    // Forcing id since its comming from database
    songPayload['artistId'] = elem.artist.id
  }

  if (elem.album.id) {
    // Forcing id since its comming from database
    songPayload['albumId'] = elem.album.id
  }

  if (elem._id) {
    // Forcing id since its comming from database
    songPayload['forcedId'] = elem._id
  }

  return new Song(songPayload)
}

export default rowToSong
