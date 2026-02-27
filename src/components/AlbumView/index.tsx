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
  const albumId = match?.params.id || ''
  
  // LiveStore hooks - call unconditionally to follow React rules
  const album = useAlbumById(albumId)
  const mediaItems = useMediaByAlbum(albumId)
  const queue = useQueue('main')
  const relatedAlbumsData = useAlbumsByArtist(album?.artistId)
  
  // Build mediaMap and songIds from the album's media items
  const { songIds, mediaMap } = useMemo(() => {
    const map: Record<string, any> = {}
    const ids: string[] = []
    
    if (Array.isArray(mediaItems)) {
      mediaItems.forEach((item: any) => {
        map[item.id] = item
        ids.push(item.id)
      })
    }
    
    return { songIds: ids, mediaMap: map }
  }, [mediaItems])

  if (!match) {
    return null
  }
  
  if (!album) {
    redirect('/')
    return null
  }

  return (
    <div className='artist-view z-50'>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-3'>{album.name}</h2>
        <Album
          queue={queue}
          album={album}
          dispatch={dispatch}
          songs={songIds}
          mediaMap={mediaMap}
        />
        <div className='w-full'>
          <RelatedAlbums albums={relatedAlbumsData as any} />
        </div>
        <div className='placeholder'></div>
      </div>
    </div>
  )
}
