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

type Props = {
  collection: { albumsByArtist: Array<string>, albums: any },
  queue: { trackIds: any },
  song: Media,
  dispatch: Dispatch,
  loading: boolean,
  className?: string|null
}

const SongView = (props: Props) => {
  const { song, queue: { trackIds }, collection: { albums, albumsByArtist } } = props

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

  const relatedAlbums = albumsByArtist && albumsByArtist[song.artist.id] && albumsByArtist[song.artist.id].map((albumId: string) => {
    return albums[albumId]
  })

  return (
    <div className={`song-view ${props.className} w-full overflow-y-auto z-10 flex flex-col`}>
      <div className="song sm:flex">
        <div className="w-full md:p-6 image md:max-w-sm lg:max-w-md xl:max-w-xl md:flex-grow-0 sticky" >
          { song.type === 'video' &&
            <div id="mini-player" />
          }
          { song.type !== 'video' &&
            <CoverImage
              useImage
              cover={song.cover}
              size='thumbnail'
              albumName={song.album ? song.album.name : 'N/A'}
            />
          }
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
              <Translate value='song.label.played' /> { song.playCount || 0 } <Translate value='song.label.times' />
            </div>
            <div className='mt-2'>
              {
                song.stream.map((provider) => {
                  return (<Tag type='primary' key={provider.service}>{ provider.service }</Tag>)
                })
              }
            </div>

            <div className='btn-group mt-10'>
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

              { !trackIds[song.id] &&
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

              { trackIds[song.id] &&
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

            </div>

          </div>
        </div>
      </div>
      <div className='py-6'>
        <RelatedAlbums albums={relatedAlbums} />
      </div>
    </div>
  )
}

export default SongView
