import type { MediaRow } from '../types/media'

const exampleSong: MediaRow = {
  id: 'example-whiplash',
  title: 'Whiplash',
  artistId: 'metallica',
  albumId: 'kill-em-all',
  artistName: 'Metallica',
  albumName: 'Kill\'em all',
  type: 'audio',
  duration: 100,
  playCount: 0,
  track: null,
  discNumber: null,
  stream: {},
  cover: {
    thumbnailUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Music49/v4/91/2c/cb/912ccb21-fcc4-269c-eab4-132a2407b286/source/600x600bb.jpg',
    fullUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Music49/v4/91/2c/cb/912ccb21-fcc4-269c-eab4-132a2407b286/source/600x600bb.jpg'
  },
  genres: ['Metal'],
  externalId: null,
  shareUrl: null,
  filePath: null,
  genresFlat: 'Metal',
  providersFlat: '',
}

export default exampleSong
