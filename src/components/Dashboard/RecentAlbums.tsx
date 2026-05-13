import { Translate } from 'react-redux-i18n'
import HorizontalSlider from '../HorizontalSlider'
import AlbumCover from '../common/AlbumCover'
import { useMemo } from 'react'
import { useRecentAlbums, useArtistsByIds } from '../../stores/livestore/hooks'
import type { AlbumRow } from '../../types/media'

type AlbumWithArtist = AlbumRow & { artistName: string }

const AlbumMediaSlider = ({ mediaItems, title }: { mediaItems: AlbumWithArtist[], title: React.ReactNode }) => {
  if (!mediaItems?.length) {
    return null
  }

  const albumItems = mediaItems.flatMap((album) => {
    if (!album || !album.id || !album.name) return []
    return [
      <AlbumCover
        key={album.id}
        id={album.id}
        name={album.name}
        artistName={album.artistName}
        cover={{
          thumbnailUrl: album.thumbnailUrl || undefined,
          fullUrl: album.thumbnailUrl || undefined
        }}
      />
    ]
  })

  if (!albumItems.length) {
    return null
  }

  return (
    <HorizontalSlider
      title={title}
      items={albumItems}
    />
  )
}

const RecentAlbums = () => {
  const recentAlbums = useRecentAlbums(10)
  const artistIds = useMemo(
    () => [...new Set((recentAlbums as unknown as AlbumRow[]).flatMap((a) => a.artistId ? [a.artistId] : []))],
    [recentAlbums]
  )
  const artistsMap = useArtistsByIds(artistIds)

  if (!recentAlbums?.length) {
    return null
  }

  // Map LiveStore albums to expected format with artist names
  const albumsWithArtists = (recentAlbums as unknown as AlbumRow[]).map(album => ({
    ...album,
    artistName: artistsMap[album.artistId]?.name || 'Unknown Artist'
  }))

  return (
    <AlbumMediaSlider
      title={<Translate value="dashboard.recentlyAdded" />}
      mediaItems={albumsWithArtists}
    />
  )
}

export default RecentAlbums 