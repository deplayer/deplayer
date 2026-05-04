import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import HeroSection from '../common/HeroSection'
import Tag from '../common/Tag'
import Button from '../common/Button'
import Icon from '../common/Icon'
import RelatedAlbums from '../RelatedAlbums'
import BecauseYouListened from '../BecauseYouListened'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'
import { State } from '../../reducers'
import { useArtistById, useAlbumsByArtist, useSongsByAlbumForArtist } from '../../stores/livestore/hooks'
import type { AlbumRow } from '../../types/media'

export default function ArtistView() {
  const params = useParams()
  const dispatch = useDispatch()
  const artistId = params.id || ''
  const [showAllTracks, setShowAllTracks] = React.useState(false)

  const artist = useArtistById(artistId)
  const albumsData = useAlbumsByArtist(artistId)
  const { songsByAlbum, mediaMap } = useSongsByAlbumForArtist(artistId)
  const artistMetadata = useSelector((state: State) => state.artist.artistMetadata)

  // Background image from first album's first song
  const backgroundImage = React.useMemo(() => {
    if (albumsData?.length > 0) {
      const firstAlbumSongs = songsByAlbum[albumsData[0].id]
      if (firstAlbumSongs?.length > 0) {
        return mediaMap[firstAlbumSongs[0]]?.cover?.fullUrl
      }
    }
    return undefined
  }, [albumsData, songsByAlbum, mediaMap])

  // Popular tracks sorted by playCount
  const popularTracks = React.useMemo(() => {
    return Object.values(mediaMap)
      .filter((s: any) => s && s.playCount > 0)
      .sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0))
  }, [mediaMap])

  // All song IDs
  const allSongIds = React.useMemo(() => Object.keys(mediaMap), [mediaMap])

  // Collect genres
  const artistGenres = React.useMemo(() => {
    const genreSet = new Set<string>()
    Object.values(mediaMap).forEach((song: any) => {
      const genres = song.genres || (song.genresFlat ? song.genresFlat.split(',') : [])
      if (Array.isArray(genres)) genres.forEach((g: string) => g.trim() && genreSet.add(g.trim()))
    })
    return Array.from(genreSet)
  }, [mediaMap])

  const artistSummary = React.useMemo(() => {
    return artistMetadata?.artist?.bio?.content || ''
  }, [artistMetadata])

  React.useEffect(() => {
    if (artist?.name) {
      dispatch({ type: types.LOAD_ARTIST, artist })
      dispatch({ type: types.FETCH_ARTIST_SONGS, artist })
      dispatch({ type: types.SET_BACKGROUND_IMAGE, backgroundImage })
    }
  }, [artist, backgroundImage, dispatch])

  if (!artist) return null

  const playAll = () => {
    if (allSongIds.length) dispatch({ type: types.PLAY_LIST, trackIds: allSongIds })
  }

  const shuffleAll = () => {
    if (allSongIds.length) {
      const shuffled = [...allSongIds].sort(() => Math.random() - 0.5)
      dispatch({ type: types.PLAY_LIST, trackIds: shuffled })
    }
  }

  const visibleTracks = showAllTracks ? popularTracks.slice(0, 10) : popularTracks.slice(0, 5)

  return (
    <div data-testid="artist-view" className="artist-view z-10 w-full">
      {/* Netflix-style Hero */}
      <HeroSection backgroundImage={backgroundImage}>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-bold">{artist.name}</h1>
          <div className="flex items-center gap-2 text-sm opacity-80 flex-wrap">
            {artistMetadata?.country && <span>{artistMetadata.country}</span>}
            {artistMetadata?.['life-span']?.begin && (
              <span>
                • {artistMetadata['life-span'].begin}
                {artistMetadata['life-span'].end && ` - ${artistMetadata['life-span'].end}`}
              </span>
            )}
            {albumsData && <span>• {albumsData.length} albums</span>}
            <span>• {allSongIds.length} songs</span>
          </div>
          {artistGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {artistGenres.slice(0, 5).map(genre => (
                <Tag key={genre} transparent>{genre}</Tag>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <Button onClick={playAll} className="btn-primary">
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="common.playAll" />
            </Button>
            <Button onClick={shuffleAll} transparent>
              <Icon icon="faRandom" className="mr-2" />
              <Translate value="common.shuffle" />
            </Button>
          </div>
          {artistMetadata?.relations && (
            <div className="flex flex-wrap gap-2 mt-2">
              {artistMetadata.relations.map((relation: Record<string, unknown>, index: number) => (
                <a
                  key={index}
                  target="_blank"
                  href={(relation.url as Record<string, string>).resource}
                  rel="noopener noreferrer"
                  className="text-xs opacity-70 hover:opacity-100 underline"
                >
                  {relation.type as string}
                </a>
              ))}
            </div>
          )}
        </div>
      </HeroSection>

      <div className="w-full md:px-8 flex flex-col gap-8 mb-12">
        {/* Popular Tracks */}
        {visibleTracks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 px-4">
              <Translate value="titles.popularTracks" />
            </h2>
            {visibleTracks.map((song: any) => (
              <SongRow
                key={song.id}
                mqlMatch={false}
                disableCovers={false}
                style={{}}
                dispatch={dispatch}
                isCurrent={false}
                slim={true}
                onClick={() => dispatch({ type: types.PLAY_LIST, trackIds: allSongIds, startFromId: song.id })}
                song={song}
              />
            ))}
            {popularTracks.length > 5 && !showAllTracks && (
              <button
                onClick={() => setShowAllTracks(true)}
                className="btn btn-ghost btn-sm mt-2 ml-4"
              >
                <Translate value="common.showMore" />
              </button>
            )}
          </div>
        )}

        {/* Discography */}
        {albumsData && albumsData.length > 0 && (
          <RelatedAlbums albums={albumsData as unknown as AlbumRow[]} />
        )}

        {/* Because you listened to */}
        {artistGenres.length > 0 && (
          <BecauseYouListened
            artistId={artistId}
            artistName={artist.name}
            genres={artistGenres}
          />
        )}

        {/* Bio */}
        {artistSummary && (
          <div className="px-4">
            <h2 className="text-xl font-semibold mb-4">
              <Translate value="titles.about" />
            </h2>
            <p className="opacity-80 leading-relaxed" dangerouslySetInnerHTML={{ __html: artistSummary }} />
          </div>
        )}
      </div>
    </div>
  )
}
