import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Artist from '../../entities/Artist'
import CoverImage from '../MusicTable/CoverImage'
import Tag from '../common/Tag'

type Props = {
  artist: Artist
  songs: string[]
  style?: React.CSSProperties
}

const ArtistGridItem = ({ artist, songs, style }: Props) => {
  const collection = useSelector((state: any) => state.collection)
  const artistMetadata = useSelector((state: any) => state.artist.artistMetadata)

  // Try to get artist photo from metadata
  const artistPhoto = artistMetadata?.[artist.name]?.relations?.find(
    (rel: any) => rel.type === 'image' || rel.type === 'photo'
  )?.url?.resource

  // If no artist photo, get a random album cover
  const getRandomAlbumCover = () => {
    const albumIds = collection.albumsByArtist[artist.id] || []
    if (albumIds.length === 0) return undefined

    const randomAlbumId = albumIds[Math.floor(Math.random() * albumIds.length)]
    const albumSongs = collection.songsByAlbum[randomAlbumId] || []
    if (albumSongs.length === 0) return undefined

    const song = collection.rows[albumSongs[0]]
    return song?.cover
  }

  const cover = artistPhoto ? {
    thumbnailUrl: artistPhoto,
    fullUrl: artistPhoto
  } : getRandomAlbumCover()

  return (
    <div 
      className="artist-grid-item w-48 m-4 transition-all duration-200 hover:scale-105"
      style={style}
    >
      <Link 
        to={`/artist/${artist.id}`}
        className="flex flex-col items-center"
      >
        <div className="w-48 h-48 rounded-lg overflow-hidden shadow-lg">
          <CoverImage
            cover={cover}
            useImage
            albumName={artist.name}
            size="thumbnail"
          />
        </div>
        
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium truncate w-full">
            {artist.name}
          </h3>
          <Tag className="mt-2">
            {songs.length} songs
          </Tag>
        </div>
      </Link>
    </div>
  )
}

export default ArtistGridItem 