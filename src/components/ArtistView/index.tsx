import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import Tag from '../common/Tag'
import Album from './Album'
import * as types from '../../constants/ActionTypes'
import { State } from '../../reducers'
import { useArtistById, useAlbumsByArtist, useSongsByAlbum, useMediaMap } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'

export default function ArtistView() {
  const params = useParams()
  const dispatch = useDispatch()
  const artistId = params.id || ''
  
  // LiveStore hooks
  const artist = useArtistById(artistId)
  const albumsData = useAlbumsByArtist(artistId)
  const songsByAlbum = useSongsByAlbum()
  const queue = useQueue('main')
  const mediaMap = useMediaMap()
  
  // Keep artistMetadata in Redux temporarily until migrated
  const artistMetadata = useSelector((state: State) => state.artist.artistMetadata)
  
  if (!artist) {
    return null
  }

  // Extract background image from first album's first song
  const extractBackground = (): string | undefined => {
    if (albumsData && albumsData.length > 0) {
      const firstAlbumId = albumsData[0].id
      const albumSongs = songsByAlbum[firstAlbumId]
      if (albumSongs && albumSongs.length > 0) {
        return mediaMap[albumSongs[0]]?.cover?.fullUrl
      }
    }
    return undefined
  }

  React.useEffect(() => {
    if (artist && artist.name) {
      dispatch({
        type: types.LOAD_ARTIST,
        artist: artist
      })

      dispatch({
        type: types.SET_BACKGROUND_IMAGE,
        backgroundImage: extractBackground()
      })
    }
  }, [artist?.name, dispatch])

  const extractSummary = (): string => {
    if (artistMetadata && artistMetadata.artist) {
      return artistMetadata.artist.bio.content
    }

    return ''
  }

  const albumRows = albumsData?.map((album: any) => {
    return (
      <Album
        queue={queue}
        key={album.id}
        album={album}
        dispatch={dispatch}
        songs={songsByAlbum[album.id] || []}
      />
    )
  })

  return (
    <div data-testid="artist-view" className='artist-view z-50'>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-2'>{artist.name}</h2>
        <p className='text-center' dangerouslySetInnerHTML={{ __html: extractSummary() }} />
        {
          artistMetadata?.['life-span'] && (
            <div className='text-center text-md'>
              {artistMetadata['life-span'].begin} {artistMetadata['life-span'].end && '- ' + artistMetadata['life-span'].end}
            </div>
          )
        }
        {
          artistMetadata?.country && (
            <div className='text-center text-md'>
              {artistMetadata.country}
            </div>
          )
        }
        <div className='py-4 text-center'>
          {
            artistMetadata?.relations && artistMetadata.relations.map((relation: any, index: number) => {
              return (
                <div key={index} className='mr-2 py-1 inline-block'>
                  <Tag transparent>
                    <a target="_blank" href={relation.url.resource}>{relation.type}</a>
                  </Tag>
                </div>
              )
            })
          }
        </div>

        <div className='yt-4'>
          {albumRows}
        </div>
        <div className='placeholder'></div>
      </div>
    </div>
  )
}
