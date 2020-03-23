import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { getDurationStr } from '../../utils/timeFormatter'
import Button from '../common/Button'
import CoverImage from '../MusicTable/CoverImage'
import RelatedAlbums from '../RelatedAlbums'
import Icon from '../common/Icon'
import Media from '../../entities/Media'
import Spinner from '..//Spinner'
import Tag from '../common/Tag'
import logger from '../../utils/logger'
import * as types from '../../constants/ActionTypes'
import { OutPortal } from 'react-reverse-portal'
import MediaSlider from '../MediaSlider'
import { sortByPlayCount } from '../../reducers/collection'
import Modal from '../common/Modal'
import Header from '../common/Header'

type Props = {
  playerPortal: any,
  location: any,
  player: any,
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
  song: Media,
  dispatch: Dispatch,
  loading: boolean,
  className?: string|null
}

const SongView = (props: Props) => {
  const [showLyrics, setShowLyrics] = React.useState(false)
  const MAX_LIST_ITEMS = 25
  const {
    song,
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
        <div className="w-full md:p-6 image md:max-w-sm lg:max-w-md xl:max-w-xl md:flex-grow-0 sticky" >
          <div>
            { songFinder && song.type === 'video' && <OutPortal node={props.playerPortal} /> }
            { (song.type !== 'video' || !songFinder) &&
              <CoverImage
                useImage
                cover={song.cover}
                size='thumbnail'
                albumName={song.album ? song.album.name : 'N/A'}
              />
            }

            <div className='btn-group mt-4 mx-4 md:mx-0'>
              { (!songFinder || !props.player.playing) &&
                <Button
                  large
                  onClick={() => {
                    props.dispatch({type: types.SET_CURRENT_PLAYING, songId: song.id})
                  }}
                >
                  <Icon
                    icon='faPlay'
                    className='mr-4'
                  />
                  <Translate value="common.play" />
                </Button>
              }

              { !trackIds.includes(song.id) &&
                <Button
                  transparent
                  alignLeft
                  onClick={() => {
                    props.dispatch({type: types.ADD_TO_QUEUE, song})
                  }}
                >
                  <Icon
                    icon='faPlusCircle'
                    className='mx-2'
                  />
                  <Translate value='buttons.addToQueue' />
                </Button>
              }

              { trackIds.includes(song.id) &&
                <Button
                  transparent
                  alignLeft
                  onClick={() => {
                    props.dispatch({type: types.REMOVE_FROM_QUEUE, song})
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
                  icon='faPlay'
                  className='mr-4'
                />
                <Translate value="common.lyrics" />
              </Button>
            </div>
          </div>

        </div>
        <div className="w-full p-6 content flex-grow">
          <div>
            <h2 className='text-3xl'>{ song.title }</h2>
            <div className='text-lg mt-2'>
              <Link to={`/artist/${ song.artist.id }`}>
                <h3>
                  <Icon
                    icon='faMicrophoneAlt'
                    className='mr-1 w-8'
                  />
                  <span>{ song.artist.name }</span>
                </h3>
              </Link>
            </div>
            <div className='color-white text-lg mt-2'>
              <Link to={`/album/${ song.album.id }`}>
                <Icon
                  className='mr-1 w-8'
                  icon='faCompactDisc'
                />
                { song.albumName || 'N/A' }
              </Link>
            </div>
            <div className='mt-4'>
              <Icon icon='faStopwatch' /> { getDurationStr(song.duration) }
            </div>
            <div className='mt-2'>
              <Tag>{ song.genre }</Tag>
            </div>
            <div className='mt-2'>
              <Tag>{ song.type }</Tag>
            </div>
            <div className='mt-2'>
              <Translate value='song.label.played' /> { song.playCount || 0 } <Translate value='song.label.times' />
            </div>
            <div className='mt-2'>
              {
                song.stream.map((provider) => {
                  return (<Tag type='primary' key={provider.service}>{ provider.service }</Tag>)
                })
              }
            </div>


          </div>
        </div>
      </div>
      <div>
        <RelatedAlbums albums={relatedAlbums} />
      </div>
      { sameGenreSongs &&
        <div className='pb-4'>
          <MediaSlider
            title={<Translate value='titles.sameGenreSongs'/>}
            mediaItems={sameGenreSongs}
          />
        </div>
      }
      {
        showLyrics && (
          <Modal
            onClose={() => {
              setShowLyrics(false)
            }}
          >
            <Header>Lyrics</Header>
            <div className='my-6 overflow-y-auto'>
              <pre>
                { props.lyrics.lyrics }
              </pre>
            </div>
          </Modal>
        )
      }
    </div>
  )
}

export default SongView
