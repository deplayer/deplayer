import { useDispatch } from 'react-redux'
import RelatedAlbums from '../RelatedAlbums'
import Album from '../ArtistView/Album'
import { useMatch } from 'react-router'
import { redirect } from 'react-router-dom'
import { useAlbumById, useMediaByAlbum, useAlbumsByArtist } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'
import { useMemo } from 'react'

export default function AlbumView() {
  const match = useMatch('/album/:id')
  const dispatch = useDispatch()

  if (!match) {
    return null
  }

  const albumId = match.params.id || ''
  
  // LiveStore hooks
  const album = useAlbumById(albumId)
  const mediaItems = useMediaByAlbum(albumId)
  const queue = useQueue('main')
  
  if (!album) {
    redirect('/')
    return null
  }

  // Get related albums by the same artist
  const relatedAlbumsData = useAlbumsByArtist(album.artistId)
  
  // Extract song IDs from media items
  const songIds = useMemo(() => 
    mediaItems.map(item => item.id)
  , [mediaItems])

  return (
    <div className='artist-view z-50'>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-3'>{album.name}</h2>
        <Album
          queue={queue}
          album={album}
          dispatch={dispatch}
          songs={songIds}
        />
        <div className='w-full'>
          <RelatedAlbums albums={relatedAlbumsData as any} />
        </div>
        <div className='placeholder'></div>
      </div>
    </div>
  )
}
