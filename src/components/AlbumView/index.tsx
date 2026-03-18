import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router'
import { redirect, Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Translate } from 'react-redux-i18n'

import HeroSection from '../common/HeroSection'
import CoverImage from '../MusicTable/CoverImage'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Album from '../ArtistView/Album'
import RelatedAlbums from '../RelatedAlbums'
import BecauseYouListened from '../BecauseYouListened'
import * as types from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'
import { useAlbumById, useMediaByAlbum, useAlbumsByArtist } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'

export default function AlbumView() {
  const match = useMatch('/album/:id')
  const dispatch = useDispatch()
  const albumId = match?.params.id || ''

  const album = useAlbumById(albumId)
  const mediaItems = useMediaByAlbum(albumId)
  const queue = useQueue('main')
  const relatedAlbumsData = useAlbumsByArtist(album?.artistId)

  const { songIds, mediaMap, totalDuration, genres } = useMemo(() => {
    const map: Record<string, unknown> = {}
    const ids: string[] = []
    let duration = 0
    const genreSet = new Set<string>()

    if (Array.isArray(mediaItems)) {
      mediaItems.forEach((item: Record<string, unknown>) => {
        map[item.id as string] = item
        ids.push(item.id as string)
        duration += (item.duration as number) || 0
        const itemGenres = (item.genres as string[]) || (item.genresFlat ? (item.genresFlat as string).split(',') : [])
        if (Array.isArray(itemGenres)) itemGenres.forEach((g: string) => g.trim() && genreSet.add(g.trim()))
      })
    }

    return { songIds: ids, mediaMap: map, totalDuration: duration, genres: Array.from(genreSet) }
  }, [mediaItems])

  const coverSource = useMemo(() => {
    const firstId = songIds[0]
    return firstId ? (mediaMap[firstId] as Record<string, unknown>)?.cover as Record<string, string> | undefined : undefined
  }, [songIds, mediaMap])

  if (!match) return null

  if (!album) {
    redirect('/')
    return null
  }

  const playAlbum = () => {
    if (songIds.length) dispatch({ type: types.PLAY_LIST, trackIds: songIds })
  }

  const shuffleAlbum = () => {
    if (songIds.length) {
      const shuffled = [...songIds].sort(() => Math.random() - 0.5)
      dispatch({ type: types.PLAY_LIST, trackIds: shuffled })
    }
  }

  return (
    <div className="album-view z-10 w-full">
      {/* Netflix-style Hero */}
      <HeroSection backgroundImage={coverSource?.fullUrl}>
        <div className="w-40 h-40 md:w-56 md:h-56 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden">
          <CoverImage
            cover={coverSource}
            size="thumbnail"
            albumName={album.name}
            useImage
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold">{album.name}</h1>
          <div className="flex items-center gap-2 text-sm opacity-80 flex-wrap">
            {album.artistId && (
              <Link to={`/artist/${album.artistId}`} className="hover:underline font-medium">
                {album.artistName || 'Unknown Artist'}
              </Link>
            )}
            {album.year && <span>• {album.year}</span>}
            <span>• {songIds.length} <Translate value="common.songs" /></span>
            {totalDuration > 0 && <span>• {getDurationStr(totalDuration)}</span>}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button onClick={playAlbum} className="btn-primary">
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="common.play" />
            </Button>
            <Button onClick={shuffleAlbum} transparent>
              <Icon icon="faShuffle" className="mr-2" />
              <Translate value="common.shuffle" />
            </Button>
          </div>
        </div>
      </HeroSection>

      {/* Track list */}
      <div className="w-full md:p-4">
        <Album
          queue={queue}
          album={album}
          dispatch={dispatch}
          songs={songIds}
          mediaMap={mediaMap}
        />
      </div>

      {/* Discovery rows */}
      <div className="w-full md:px-4 flex flex-col gap-8 mb-12">
        {genres.length > 0 && album.artistId && (
          <BecauseYouListened
            artistId={album.artistId}
            artistName={album.artistName || 'Unknown'}
            genres={genres}
          />
        )}
        <RelatedAlbums albums={relatedAlbumsData as Record<string, unknown>[]} />
      </div>
    </div>
  )
}
