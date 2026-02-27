import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import Tag from '../common/Tag'
import Album from './Album'
import * as types from '../../constants/ActionTypes'
import { State } from '../../reducers'
import { useArtistById, useAlbumsByArtist, useSongsByAlbumForArtist } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'

export default function ArtistView() {
  const params = useParams()
  const dispatch = useDispatch()
  const artistId = params.id || ''
  
  // LiveStore hooks - OPTIMIZED: Only fetch this artist's songs, not entire library
  const artist = useArtistById(artistId)
  const albumsData = useAlbumsByArtist(artistId)
  const { songsByAlbum, mediaMap } = useSongsByAlbumForArtist(artistId)
  const queue = useQueue('main')
  
  // Keep artistMetadata in Redux temporarily until migrated
  const artistMetadata = useSelector((state: State) => state.artist.artistMetadata)
  
  // Extract background image from first album's first song
  const extractBackground = React.useCallback((): string | undefined => {
    if (albumsData && albumsData.length > 0) {
      const firstAlbumId = albumsData[0].id
      const albumSongs = songsByAlbum[firstAlbumId]
      if (albumSongs && albumSongs.length > 0) {
        return mediaMap[albumSongs[0]]?.cover?.fullUrl
      }
    }
    return undefined
  }, [albumsData, songsByAlbum, mediaMap])

  // Memoize album rows - must be before any early returns (React hooks rules)
  const albumRows = React.useMemo(() => {
    if (!albumsData) return null
    return albumsData.map((album: any) => (
      <Album
        queue={queue}
        key={album.id}
        album={album}
        dispatch={dispatch}
        songs={songsByAlbum[album.id] || []}
        mediaMap={mediaMap}
      />
    ))
  }, [albumsData, queue, songsByAlbum, mediaMap, dispatch])

  // Extract artist bio summary
  const artistSummary = React.useMemo(() => {
    if (artistMetadata?.artist?.bio?.content) {
      return artistMetadata.artist.bio.content
    }
    return ''
  }, [artistMetadata])

  React.useEffect(() => {
    if (artist && artist.name) {
      // Fetch artist metadata from MusicBrainz
      dispatch({
        type: types.LOAD_ARTIST,
        artist: artist
      })

      // Fetch songs from all providers
      dispatch({
        type: types.FETCH_ARTIST_SONGS,
        artist: artist
      })

      dispatch({
        type: types.SET_BACKGROUND_IMAGE,
        backgroundImage: extractBackground()
      })
    }
  }, [artist, extractBackground, dispatch])
  
  if (!artist) {
    return null
  }

  return (
    <div data-testid="artist-view" className='artist-view z-50'>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-2'>{artist.name}</h2>
        <p className='text-center' dangerouslySetInnerHTML={{ __html: artistSummary }} />
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
