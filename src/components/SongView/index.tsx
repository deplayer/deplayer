import { Dispatch } from 'redux'
import { Link, useNavigate } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import { AutoSizer } from 'react-virtualized'

import NotFound from '../NotFound'
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
import { sortByPlayCount } from '../../reducers/collection'
import Lyrics from './Lyrics'
import { getStreamUri } from '../../services/Song/StreamUriService'
import IAlbum from '../../entities/Album'
import ServiceIcon from '../ServiceIcon'
import Media, { IMedia } from '../../entities/Media'
import { State as SettingsState } from '../../reducers/settings'

const MAX_LIST_ITEMS = 25

type Props = {
  playerPortal: any,
  location: any,
  player: any,
  settings: any,
  lyrics: {
    lyrics: string
  },
  collection: {
    albums: { [key: string]: IAlbum },
    albumsByArtist: { [key: string]: string[] },
    songsByGenre: any,
    rows: { [key: string]: IMedia }
  },
  queue: { trackIds: any, currentPlaying?: string },
  songId: string,
  dispatch: Dispatch,
  loading: boolean,
  className?: string | null
}

async function changeCurrentPlaying(song: any, index: number, dispatch: Dispatch, settings: SettingsState) {
  const streamUri = await getStreamUri(song, settings.settings, index)
  dispatch({ type: types.SET_CURRENT_PLAYING_URL, url: streamUri })
}

const SongView = ({ songId, loading, className = '', dispatch, playerPortal, player, lyrics, queue, settings, collection }: Props) => {
  const navigate = useNavigate()
  const { trackIds, currentPlaying } = queue
  const { rows, albums, albumsByArtist, songsByGenre } = collection

  const song = rows[songId]
  const songObj = song ? new Media(song) : null
  const isSongPinned = songObj?.hasAnyProviderOf(['opfs']) || false

  const [pinned, setPinnedSong] = React.useState(isSongPinned)
  const [downloadUrls, setDownloadUrls] = React.useState([])
  const [showLyrics, setShowLyrics] = React.useState(false)

  React.useEffect(() => {
    const retrieveUrls = async () => {
      const urls: any = []
      if (!song) return

      for (let i = 0; i < Object.values(song.stream || {}).length; i++) {
        urls.push(await getStreamUri(song, settings.settings, i))
      }
      setDownloadUrls(urls)
    }
    retrieveUrls()
  }, [song, settings])

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
    return <NotFound>The requested song can not be found</NotFound>
  }

  const genres = song.genres || []

  const sameGenreSongs = genres.length && songsByGenre[genres[0]]
    ? songsByGenre[genres[0]]
      .sort((songId1: string, songId2: string) => sortByPlayCount(songId1, songId2, rows))
      .slice(0, MAX_LIST_ITEMS)
      .map((songId: string) => rows[songId])
    : null

  const relatedAlbums = song.artist.id && albumsByArtist?.[song.artist.id].reduce((acc: IAlbum[], albumId: string): IAlbum[] => {
    if (!albums[albumId]) return acc
    acc.push(albums[albumId])
    return acc
  }, []) || []

  const songFinder = song.id === currentPlaying

  const handleGenreClick = (genre: string) => {
    // Reset all filters first
    dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
    // Set the genre filter
    dispatch({
      type: types.SET_COLLECTION_FILTER,
      filterType: 'genres',
      values: [genre]
    })
    // Navigate to collection view
    navigate('/collection')
  }

  const handleTypeClick = (type: string) => {
    // Reset all filters first
    dispatch({ type: types.CLEAR_COLLECTION_FILTERS })
    // Set the type filter
    dispatch({
      type: types.SET_COLLECTION_FILTER,
      filterType: 'types',
      values: [type]
    })
    // Navigate to collection view
    navigate('/collection')
  }

  const typeIcon = song.type === 'audio' ? <Icon className='pr-2' icon='faMusic' /> : <Icon className='pr-2' icon='faVideo' />

  return (
    <div data-testid="song-view" className={`song-view ${className} w-full overflow-y-auto z-10 flex flex-col`}>
      <div className="song sm:flex">
        <div style={{ background: 'rgba(0, 0, 0, 0.2)' }} className="w-full md:m-6 md:rounded-b-lg image lg:max-w-md xl:max-w-xl">
          <div className='flex flex-col w-full md:sticky md:top-0'>
            {songFinder && song.type === 'video' && (
              <OutPortal
                id='player-portal'
                className={`flex w-full player-portal`}
                node={playerPortal}
              />
            )}
            {(song.type !== 'video' || !songFinder) &&
              <CoverImage
                useImage
                cover={song.cover}
                size='thumbnail'
                albumName={song.album.name || 'N/A'}
              />
            }

            <div className='btn-group md:mx-0 flex items-center flex-wrap p-4'>
              {(!songFinder || !player.playing) &&
                <Button
                  large
                  onClick={() => {
                    dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
                  }}
                >
                  <Icon
                    icon='faPlay'
                    className='mr-2'
                  />
                  <Translate value="common.play" />
                </Button>
              }

              {!trackIds.includes(song.id) &&
                <Button
                  transparent
                  alignLeft
                  onClick={() => {
                    dispatch({ type: types.ADD_TO_QUEUE, songs: [song] })
                  }}
                >
                  <Icon
                    icon='faPlusCircle'
                    className='mx-2'
                  />
                  <Translate value='buttons.addToQueue' />
                </Button>
              }

              {trackIds.includes(song.id) &&
                <Button
                  transparent
                  alignLeft
                  onClick={() => {
                    dispatch({ type: types.REMOVE_FROM_QUEUE, song })
                  }}
                >
                  <Icon
                    icon='faMinusCircle'
                    className='mx-2'
                  />
                  <Translate value='buttons.removeFromQueue' />
                </Button>
              }

              <Button
                large
                transparent
                onClick={() => {
                  setShowLyrics(true)
                }}
              >
                <Icon
                  icon='faScroll'
                  className='mr-2'
                />
                <Translate value="common.lyrics" />
              </Button>

              <Button
                large
                transparent
                onClick={() => {
                  if (!pinned) {
                    dispatch({ type: types.PIN_SONG, songId: song.id })
                    setPinnedSong(true)
                  } else {
                    dispatch({ type: types.UNPIN_SONG, songId: song.id })
                    setPinnedSong(false)
                  }
                }}
              >
                <Icon
                  icon={pinned ? 'faMinusCircle' : 'faPlusCircle'}
                  className='mr-2'
                />
                {pinned ? <Translate value="media.unpin" /> : <Translate value="media.pin" />}
              </Button>

              {
                downloadUrls.map((url) => {
                  return (
                    <a
                      key={url}
                      className='p-4'
                      target="_blank"
                      href={url}
                    >
                      <Icon
                        icon='faDownload'
                        className='mr-2'
                      />
                      <Translate value="buttons.downloadMedia" />
                    </a>
                  )
                })
              }
            </div>
          </div>
        </div>

        <div className="content flex-grow pt-6 sm:pt-0 md:pt-6 md:pr-6 justify-between">
          <div style={{ background: 'rgba(0, 0, 0, 0.2)' }} className="p-6 rounded-lg">
            <div className='flex items-center justify-between'>
              <h2 className='text-3xl text-wrap truncate ...'>{song.title}</h2>
              <Tag onClick={() => handleTypeClick(song.type)} className="cursor-pointer hover:bg-opacity-50 mr-2" transparent>{typeIcon} {song.type}</Tag>
            </div>
            <div className='text-lg mt-2'>
              <Link to={`/artist/${song.artist.id}`}>
                <h3>
                  <Icon
                    icon='faMicrophoneAlt'
                    className='mr-1 w-8'
                  />
                  <span>{song.artist.name}</span>
                </h3>
              </Link>
            </div>
            <div className='color-white text-lg mt-2'>
              <Link to={`/album/${song.album.id}`}>
                <Icon
                  className='mr-1 w-8'
                  icon='faCompactDisc'
                />
                {song.album.name || 'N/A'} {song.album.year && `(${song.album.year})`}
              </Link>
            </div>
            {song.genres?.length > 0 && (
              <div className='mt-2 flex flex-wrap'>
                {Array.from(new Set(song.genres)).map((genre: string) => (
                  <Tag
                    key={genre}
                    transparent
                    onClick={() => handleGenreClick(genre)}
                    className="cursor-pointer hover:bg-opacity-50 mr-2 mb-2"
                  >
                    {genre}
                  </Tag>
                ))}
              </div>
            )}
            <div className='mt-4'>
              <Icon icon='faStopwatch' /> {getDurationStr(song.duration)}
            </div>
            <div className='mt-2'>
              <Translate value='song.label.played' /> {song.playCount ?? 0} <Translate value='song.label.times' />
            </div>
            <div className='mt-2 flex items-center'>
              <Translate className='mr-2' value='labels.providers' />
              {
                Object.values(song.stream).map((value: any, index: number) => {
                  return (
                    <Button
                      onClick={() => changeCurrentPlaying(song, index, dispatch, settings)}
                      key={`${value.service}_${index}`}
                      inverted
                    >
                      <ServiceIcon service={value.service} />
                      <p className='capitalize'>{value.service}</p>
                    </Button>
                  )
                })
              }
            </div>
          </div>
          {
            showLyrics && (
              <Lyrics
                dispatch={dispatch}
                songId={song.id}
                lyrics={lyrics.lyrics}
                onClose={() => setShowLyrics(false)}
              />
            )
          }

          <AutoSizer>
            {({ width }) => (
              <div className='flex flex-col pt-8' style={{ width: width }}>
                <RelatedAlbums albums={relatedAlbums} />
                {sameGenreSongs &&
                  <MediaSlider
                    title={<Translate value='titles.sameGenreSongs' />}
                    mediaItems={sameGenreSongs}
                  />
                }
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  )
}

export default SongView
