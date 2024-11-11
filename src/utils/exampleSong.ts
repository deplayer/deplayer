import Media from '../entities/Media'
import { mediaParams } from '../entities/Media.spec'

const exampleSong = new Media({
  ...mediaParams,
  title: 'Whiplash',
  artistName: 'Metallica',
  albumName: 'Kill\'em all',
  cover: {
    thumbnailUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Music49/v4/91/2c/cb/912ccb21-fcc4-269c-eab4-132a2407b286/source/600x600bb.jpg',
    fullUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Music49/v4/91/2c/cb/912ccb21-fcc4-269c-eab4-132a2407b286/source/600x600bb.jpg'
  },
  genres: ['Metal'],
  duration: 100
})

export default exampleSong
