import { Dispatch } from 'redux'
import { Link, useNavigate } from 'react-router-dom'
import { I18n, Translate } from 'react-redux-i18n'
import * as React from 'react'
import { AutoSizer } from 'react-virtualized'

import CenteredMessage from '../common/CenteredMessage'
import { getDurationStr } from '../../utils/timeFormatter'
import Button from '../common/Button'
import CoverImage from '../MusicTable/CoverImage'
import RelatedAlbums from '../RelatedAlbums'
import Icon from '../common/Icon'
import Spinner from '../Spinner'
import Tag from '../common/Tag'
import * as types from '../../constants/ActionTypes'
import { OutPortal } from 'react-reverse-portal'
import MediaSlider from '../MediaSlider'
import { sortByPlayCount } from '../../utils/sorting'
import Lyrics from './Lyrics'
import BecauseYouListened from '../BecauseYouListened'
import { getStreamUri, releaseStreamSource } from '../../services/Song/StreamUriService'
import type { StreamSource } from '../../services/Song/StreamUriService'
import type { AlbumRow, Stream } from '../../types/media'
import { hasAnyProviderOf } from '../../utils/hasAnyProviderOf'
import ServiceIcon from '../ServiceIcon'
import { State as CollectionState } from '../../reducers/collection'
import { State as PlayerState } from '../../reducers/player'
import FavoriteButton from '../common/FavoriteButton'
import { useQueue } from '../../stores/livestore/hooks'
import { getActiveTrackIds, resolveCurrentSongId } from '../../stores/livestore/queue'
import { useUIStore } from '../../stores/uiStore'
import { useAppStore } from '../../stores/livestore/store'
import { addToQueueAction, removeFromQueueAction } from '../../stores/livestore/actions'

const MAX_LIST_ITEMS = 25

// Stable empty list: shared identity keeps memo dependencies from changing
// on every render when the song has no genres.
const EMPTY_GENRES: string[] = []

type Props = {
  playerPortal: React.ComponentProps<typeof OutPortal>['node'],
  location: Location,
  player: PlayerState,
  collection: CollectionState,
  songId: string,
  dispatch: Dispatch,
  loading: boolean,
  className?: string | null
}

type StreamUrl = {
  url: string;
  isBlob: boolean;
  format: string | undefined;
  service: string;
}

const SongView = ({ songId, loading, className = '', dispatch, playerPortal, player, collection }: Props) => {
  const navigate = useNavigate()
  const liveQueue = useQueue('default')
  const setFilter = useUIStore(s => s.setFilter)
  const clearFilters = useUIStore(s => s.clearFilters)
  const liveStore = useAppStore()
  
  const trackIds = getActiveTrackIds(liveQueue)
  const currentPlaying = resolveCurrentSongId(liveQueue)

  const { rows, albums, albumsByArtist, songsByGenre } = collection

  const song = rows[songId]
  const isSongPinned = song ? hasAnyProviderOf(song.stream, ['opfs']) : false

  const [pinned, setPinnedSong] = React.useState(isSongPinned)
  const [showLyrics, setShowLyrics] = React.useState(false)
  const [streamUrls, setStreamUrls] = React.useState<StreamUrl[]>([])

  // Stable identity when the song has no genres (the `|| []` would otherwise
  // allocate a fresh array each render and invalidate the memos below).
  const genres = song?.genres ?? EMPTY_GENRES

  // Memoized so player-prop re-renders don't rebuild the recommendation
  // sliders — react-slick otherwise re-rendered ~130 cover/link/icon leaves
  // per interaction. Copy before sort: the old in-place sort mutated the
  // shared collection array on every render.
  const sameGenreSongs = React.useMemo(() => {
    if (!genres.length || !songsByGenre[genres[0]]) return null
    return [...songsByGenre[genres[0]]]
      .sort((songId1: string, songId2: string) => sortByPlayCount(songId1, songId2, rows))
      .slice(0, MAX_LIST_ITEMS)
      .map((songId: string) => rows[songId])
  }, [genres, songsByGenre, rows])

  const relatedAlbums = React.useMemo(() => {
    if (!song?.artistId || !albumsByArtist?.[song.artistId]) return []
    return albumsByArtist[song.artistId].reduce((acc: AlbumRow[], albumId: string): AlbumRow[] => {
      if (!albums[albumId]) return acc
      acc.push(albums[albumId])
      return acc
    }, [])
  }, [song?.artistId, albumsByArtist, albums])

  // Element-level memos: when only `player` changes, React skips these
  // subtrees entirely instead of re-rendering the slider machinery.
  const becauseYouListenedBlock = React.useMemo(
    () => (song?.artistId && genres.length > 0 ? (
      <div className="mt-8 overflow-hidden">
        <BecauseYouListened artistId={song.artistId} artistName={song.artistName || I18n.t('common.unknownArtist')} genres={genres} />
      </div>
    ) : null),
    [song?.artistId, song?.artistName, genres]
  )

  const relatedAlbumsBlock = React.useMemo(
    () => <RelatedAlbums albums={relatedAlbums} />,
    [relatedAlbums]
  )

  const sameGenreSlider = React.useMemo(
    () => (sameGenreSongs ? (
      <MediaSlider
        title={<Translate value='titles.sameGenreSongs' />}
        mediaItems={sameGenreSongs}
      />
    ) : null),
    [sameGenreSongs]
  )

  React.useEffect(() => {
    if (!song) return

    let cancelled = false
    // Sources probed for the download list; the service owns their blobs —
    // release them all when the list is replaced or the view unmounts.
    const loaded: StreamSource[] = []

    const loadStreamUrls = async () => {
      const urls = await Promise.all(
        Object.values(song.stream || {}).map(async (value: Stream & { format?: string }, index: number) => {
          const source = await getStreamUri(song, index)
          if (!source.url) return null
          loaded.push(source)
          if (cancelled) return null
          return {
            url: source.url,
            isBlob: source.kind === 'blob',
            format: value.format || undefined,
            service: value.service
          } as StreamUrl
        })
      )
      if (cancelled) return
      setStreamUrls(urls.filter((url): url is StreamUrl => url !== null))
    }

    loadStreamUrls()

    return () => {
      cancelled = true
      loaded.forEach(releaseStreamSource)
    }
  }, [song])

  if (loading) {
    return (
      <div className={`collection`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  if (!song || !song.id) {
    return <CenteredMessage><div className='text-center'><Translate value='message.songNotFound' /></div></CenteredMessage>
  }

  const songFinder = song.id === currentPlaying

  const handleGenreClick = (genre: string) => {
    // Reset all filters first
    clearFilters()
    // Set the genre filter
    setFilter('genres', [genre])
    // Navigate to collection view
    navigate('/collection')
  }

  const handleTypeClick = (type: string) => {
    // Reset all filters first
    clearFilters()
    // Set the type filter
    setFilter('types', [type])
    // Navigate to collection view
    navigate('/collection')
  }

  const typeIcon = song.type === 'audio' ? <Icon className='mr-1' icon='faMusic' /> : <Icon className='mr-1' icon='faVideo' />
  // Side-by-side only from lg: below it a shrink-0 full-width cover squeezes the info column to ~0px.
  const flexDirection = song.type === 'video' ? 'flex-col' : 'flex-col lg:flex-row'
  const imageSize = song.type === 'video' ? 'w-full' : 'p-4 sm:p-6 sm:max-w-md sm:mx-auto lg:mx-0 lg:max-w-md xl:max-w-xl'
  const inQueue = trackIds.includes(song.id)
  const playCount = song.playCount ?? 0
  const iconButton = 'btn btn-circle btn-ghost border border-base-content/20 hover:border-base-content/40'

  const togglePin = () => {
    dispatch({ type: pinned ? types.UNPIN_SONG : types.PIN_SONG, songId: song.id })
    setPinnedSong(!pinned)
  }

  const toggleQueue = async () => {
    if (!liveStore) return
    if (inQueue) {
      await removeFromQueueAction(liveStore, song.id)
    } else {
      await addToQueueAction(liveStore, [song.id])
    }
  }

  return (
    <div data-testid="song-view" className={`song-view ${className} w-full overflow-y-auto z-10 flex flex-col`}>
      <div className={`song flex ${flexDirection}`}>
        <div className={`w-full shrink-0 ${imageSize}`}>
          <div className='flex flex-col w-full lg:sticky lg:top-0 rounded-lg overflow-hidden'>
            {songFinder && song.type === 'video' && (
              <OutPortal
                id='player-portal'
                node={playerPortal}
              />
            )}
            {(song.type !== 'video' || !songFinder) &&
              <CoverImage
                useImage
                cover={song.cover || undefined}
                size='full'
                albumName={song.albumName || I18n.t('common.unknownAlbum')}
              />
            }
          </div>
        </div>

        <div className="content flex-grow px-4 pb-4 sm:px-6 lg:pl-0 lg:pt-6 justify-between min-w-0">
          <div style={{ background: 'rgba(0, 0, 0, 0.2)' }} className="p-6 rounded-lg">
            <h2 className='text-4xl font-bold leading-tight break-words'>
              {song.title}
            </h2>
            {song.artistId && (
              <Link to={`/artist/${song.artistId}`} className='block mt-2 text-xl text-primary hover:underline w-fit'>
                {song.artistName || <Translate value='common.unknownArtist' />}
              </Link>
            )}
            {song.albumId && (
              <Link to={`/album/${song.albumId}`} className='block mt-1 text-base-content/70 hover:underline w-fit'>
                {song.albumName || <Translate value='common.unknownAlbum' />}
              </Link>
            )}
            <div className='mt-3 flex flex-wrap items-center gap-x-2 text-sm text-base-content/60'>
              <button
                type='button'
                onClick={() => handleTypeClick(song.type)}
                className='inline-flex items-center capitalize hover:text-base-content'
              >
                {typeIcon}{song.type}
              </button>
              <span aria-hidden>·</span>
              <span>{getDurationStr(song.duration)}</span>
              <span aria-hidden>·</span>
              <span>
                {playCount === 0
                  ? <Translate value='common.neverPlayed' />
                  : <Translate value='common.playedTimes' count={playCount} />}
              </span>
            </div>
            {song.genres?.length > 0 && (
              <div className='mt-3 flex flex-wrap gap-2'>
                {song.genres.map((genre: string) => (
                  <Tag
                    key={genre}
                    transparent
                    onClick={() => handleGenreClick(genre)}
                    className="cursor-pointer hover:bg-opacity-50"
                  >
                    {genre}
                  </Tag>
                ))}
              </div>
            )}

            <div className='mt-6 flex flex-wrap items-center gap-3' data-testid='song-actions'>
              {(!songFinder || !player.playing) &&
                <button
                  type='button'
                  className='btn btn-primary rounded-full px-6 normal-case text-base'
                  onClick={() => dispatch({ type: types.PLAY_SONG, songId: song.id })}
                >
                  <Icon icon='faPlay' />
                  <Translate value='common.play' />
                </button>
              }
              <div className='tooltip' data-tip={I18n.t(inQueue ? 'buttons.removeFromQueue' : 'buttons.addToQueue')}>
                <button
                  type='button'
                  className={`${iconButton} ${inQueue ? 'text-primary' : ''}`}
                  onClick={toggleQueue}
                  aria-label={I18n.t(inQueue ? 'buttons.removeFromQueue' : 'buttons.addToQueue')}
                  aria-pressed={inQueue}
                >
                  <Icon icon={inQueue ? 'faCheck' : 'faList'} />
                </button>
              </div>
              <FavoriteButton songId={song.id} className={`${iconButton} p-0 !rounded-full`} />
              <div className='tooltip' data-tip={I18n.t('common.lyrics')}>
                <button
                  type='button'
                  className={iconButton}
                  onClick={() => setShowLyrics(true)}
                  aria-label={I18n.t('common.lyrics')}
                >
                  <Icon icon='faScroll' />
                </button>
              </div>
              <div className='tooltip' data-tip={I18n.t(pinned ? 'common.unpin' : 'common.pin')}>
                <button
                  type='button'
                  className={`${iconButton} ${pinned ? 'text-primary' : ''}`}
                  onClick={togglePin}
                  aria-label={I18n.t(pinned ? 'common.unpin' : 'common.pin')}
                  aria-pressed={pinned}
                >
                  <Icon icon='faHardDrive' />
                </button>
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-2'>
              <label className='text-sm text-base-content/60' htmlFor='providers-section'><Translate value='labels.providers' /></label>
              <div className='flex flex-wrap gap-2' id='providers-section'>
                {
                  Object.values(song.stream).map((value: Stream, index: number) => {
                    const streamUrl = streamUrls.find(url => url.service === value.service)
                    return (
                      <div
                        key={value.service}
                        className='flex items-center w-full sm:w-auto bg-base-300 rounded-lg overflow-hidden'
                      >
                        <div className='flex items-center gap-2 px-3 py-2 bg-base-200'>
                          <div className='w-5 h-5 flex items-center justify-center'>
                            <ServiceIcon service={value.service} />
                          </div>
                          <p className='capitalize font-medium'>{value.service}</p>
                        </div>
                        <div className='flex-1 flex gap-2 px-3 py-1'>
                          <Button
                            onClick={() => dispatch({ type: types.PLAY_SONG_FROM, songId: song.id, providerIndex: index })}
                            className='btn-sm btn-ghost border border-base-content/20 min-w-[2.5rem]'
                            aria-label={I18n.t('common.playFrom', { service: value.service })}
                          >
                            <Icon icon='faPlay' className='text-lg' />
                          </Button>
                          {streamUrl && (
                            <a
                              className='btn btn-sm btn-outline min-w-[2.5rem]'
                              href={streamUrl.url}
                              download={streamUrl.isBlob ? `${song.title}.${streamUrl.format || 'mp3'}` : undefined}
                              target={streamUrl.isBlob ? undefined : "_blank"}
                              rel={streamUrl.isBlob ? undefined : "noopener noreferrer"}
                              aria-label={I18n.t('common.downloadFrom', { service: value.service })}
                            >
                              <Icon icon='faDownload' className='text-lg' />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
          {
            showLyrics && (
              <Lyrics
                dispatch={dispatch}
                songId={song.id}
                onClose={() => setShowLyrics(false)}
                isOpen={showLyrics}
              />
            )
          }

          {becauseYouListenedBlock}

          <AutoSizer>
            {({ width }) => (
              <div className='flex flex-col pt-8' style={{ width: width }}>
                {relatedAlbumsBlock}
                {sameGenreSlider}
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  )
}

export default SongView
