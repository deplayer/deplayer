import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import { AutoSizer } from 'react-virtualized'

import { getDurationStr } from '../../utils/timeFormatter'
import Button from '../common/Button'
import CoverImage from '../MusicTable/CoverImage'
import RelatedAlbums from '../RelatedAlbums'
import Icon from '../common/Icon'
import Media from '../../entities/Media'
import Spinner from '..//Spinner'
import Tag from '../common/Tag'
import * as types from '../../constants/ActionTypes'
import { OutPortal } from 'react-reverse-portal'
import MediaSlider from '../MediaSlider'
import { sortByPlayCount } from '../../reducers/collection'
import Lyrics from './Lyrics'
import { getStreamUri } from '../../services/Song/StreamUriService'

type Props = {
  playerPortal: any,
  location: any,
  player: any,
  settings: any,
  lyrics: {
    lyrics: string
  },
  collection: {
    albumsByArtist: Array<string>,
    albums: any,
    songsByGenre: any,
    rows: any
  },
  queue: { trackIds: any, currentPlaying: string },
  songId: string,
  dispatch: Dispatch,
  loading: boolean,
  className?: string | null
}

const SongView = (props: Props) => {
  const song = props.collection.rows[props.songId] || props.collection.rows[props.queue.currentPlaying]

  const [downloadUrls, setDownloadUrls] = React.useState([])
  const [showLyrics, setShowLyrics] = React.useState(false)
  const MAX_LIST_ITEMS = 25
  const {
    queue: {
      trackIds,
      currentPlaying
    },
    collection: {
      rows,
      albums,
      albumsByArtist
    }
  } = props

  React.useMemo(() => {
    const retrieveUrls = async () => {
      const urls: any = []

      if (!song) {
        return
      }

      for (let i = 0; i < song.stream.length; i++) {
        urls.push(
          await getStreamUri(song, props.settings.settings, i)
        )
      }

      setDownloadUrls(urls)
    }

    retrieveUrls()
  }, [song, props.settings])

  console.log('song view', song)


  if (props.loading) {
    return (
      <div className={`collection`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  if (!song || !song.id) {
    return null
  }

  const sameGenreSongs = song.genres && song.genres.length && props.collection.songsByGenre[song.genres[0]]
    ? props.collection
      .songsByGenre[song.genres[0]]
      .sort((songId1: string, songId2: string) => sortByPlayCount(songId1, songId2, rows))
      .slice(0, MAX_LIST_ITEMS)
      .map((songId: string) => rows[songId])
    : null

  const relatedAlbums = albumsByArtist && albumsByArtist[song.artist.id] && albumsByArtist[song.artist.id].map((albumId: string) => {
    return albums[albumId]
  })

  const songFinder = song.id === currentPlaying

  return (
    <div className={`song-view ${props.className} w-full overflow-y-auto z-10 flex flex-col`}>
      <div className="song sm:flex">
        <div style={{ background: 'rgba(0, 0, 0, 0.2)' }} className="w-full md:m-6 md:rounded-b-lg image lg:max-w-md xl:max-w-xl">
          <div className='flex flex-col w-full md:sticky md:top-0'>
            {songFinder && song.media_type === 'video' && (
              <OutPortal
                className={`flex w-full`}
                node={props.playerPortal}
              />
            )}
            {(song.media_type !== 'video' || !songFinder) &&
              <CoverImage
                useImage
                cover={song.cover}
                size='thumbnail'
                albumName={song.album ? song.album.name : 'N/A'}
              />
            }

            <div className='btn-group md:mx-0 flex items-center flex-wrap p-4'>
              {(!songFinder || !props.player.playing) &&
                <Button
                  large
                  onClick={() => {
                    props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: song.id })
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
                    props.dispatch({ type: types.ADD_TO_QUEUE, songs: [song] })
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
                    props.dispatch({ type: types.REMOVE_FROM_QUEUE, song })
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

        <div className="content flex-grow pt-6 sm:pt-0 md:pt-6 md:pr-6">
          <div style={{ background: 'rgba(0, 0, 0, 0.2)' }} className="p-6 rounded-lg">
            <h2 className='text-3xl'>{song.title}</h2>
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
                {song.albumName || 'N/A'}
              </Link>
            </div>
            <div className='mt-4'>
              <Icon icon='faStopwatch' /> {getDurationStr(song.duration)}
            </div>
            <div className='mt-2'>
              <Tag>{song.genre}</Tag>
            </div>
            <div className='mt-2'>
              <Tag>{song.media_type}</Tag>
            </div>
            <div className='mt-2'>
              <Translate value='song.label.played' /> {song.playCount || 0} <Translate value='song.label.times' />
            </div>
            <div className='mt-2'>
              <Translate value='labels.providers' />: &nbsp;
              {
                song.stream.map((provider) => {
                  return (<Tag type='primary' key={provider.service}>{provider.service}</Tag>)
                })
              }
            </div>
          </div>
          {
            showLyrics && (
              <Lyrics
                lyrics={props.lyrics.lyrics}
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
