import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import Artist from '../../entities/Artist'
import CoverImage from '../MusicTable/CoverImage'
import Tag from '../common/Tag'
import React from 'react'
import { State as RootState } from '../../reducers'
import IMedia from '../../entities/Media'

type Props = {
  artist: Artist
  songs: string[]
  style?: React.CSSProperties
}

type ArtistRelation = {
  type: string
  url: {
    resource: string
  }
}

const ArtistGridItem = ({ artist, songs, style }: Props) => {
  // More specific selectors with proper typing
  const albumsByArtist = useSelector((state: RootState) => state.collection.albumsByArtist[artist.id])
  const songsByAlbum = useSelector((state: RootState) => state.collection.songsByAlbum)
  const collectionRows = useSelector((state: RootState) => state.collection.rows)
  const artistMetadata = useSelector((state: RootState) => 
    state.artist.artistMetadata?.[artist.name]?.relations as ArtistRelation[] | undefined
  )

  // Memoize the artist photo
  const artistPhoto = useMemo(() => {
    return artistMetadata?.find(
      (rel) => rel.type === 'image' || rel.type === 'photo'
    )?.url?.resource
  }, [artistMetadata])

  // Memoize the random album cover
  const randomAlbumCover = useMemo(() => {
    if (!albumsByArtist || albumsByArtist.length === 0) return undefined

    const randomAlbumId = albumsByArtist[Math.floor(Math.random() * albumsByArtist.length)]
    const albumSongs = songsByAlbum[randomAlbumId] || []
    if (albumSongs.length === 0) return undefined

    const song = collectionRows[albumSongs[0]] as IMedia
    return song?.cover
  }, [albumsByArtist, songsByAlbum, collectionRows])

  const cover = artistPhoto ? {
    thumbnailUrl: artistPhoto,
    fullUrl: artistPhoto
  } : randomAlbumCover

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

// Memoize the entire component
export default React.memo(ArtistGridItem) 