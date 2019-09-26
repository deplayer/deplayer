import { Link } from 'react-router-dom'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import * as types from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import Spinner from '..//Spinner'
import logger from '../../utils/logger'

type Props = {
  queue: any,
  song: Song,
  dispatch: Dispatch,
  loading: boolean,
  className: string|null
}

const SongView = (props: Props) => {
  const { song } = props

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
    logger.log('SongView', 'Song not found redirecting to home ')
  }

  return (
    <div className={`song-view ${props.className}`}>
      <div className='song'>
        <div className='image'>
          <img
            className='artist-image'
            alt={song.title}
            src={song.cover.fullUrl}
          />
        </div>
        <div className='content'>
          <div>
            <div>
              <div>
                <div>
                  <h2>{ song.title }</h2>
                </div>
              </div>
              <div>
                <div>
                  <Link to={`/artist/${ song.artist.id }`}>
                    <h3>{ song.artist.name }</h3>
                  </Link>
                </div>
              </div>
              <div>
                <div className='collapsed'>
                  <span className='label'><Translate value='song.label.album' /></span>
                </div>
                <div>
                  { song.albumName || 'N/A' }
                </div>
              </div>
              <div>
                <div className='collapsed'>
                  <span className='label'><Translate value='song.label.duration' /></span>
                </div>
                <div>
                  { getDurationStr(song.duration) }
                </div>
              </div>
              <div>
                <div className='collapsed'>
                  <span className='label'><Translate value='song.label.genre' /></span>
                </div>
                <div>
                  { song.genre }
                </div>
              </div>
              <div>
                <div className='collapsed'>
                  <span className='label'><Translate value='song.label.playCount' /></span>
                </div>
                <div>
                  { song.playCount || 0 }
                </div>
              </div>
              <div>
                <div className='collapsed'>
                  <span className='label'><Translate value='song.label.providers' /></span>
                </div>
                <ul>
                  {
                    song.stream.map((provider) => {
                      return (<li key={provider.service}>{ provider.service }</li>)
                      })
                  }
                </ul>
              </div>

              <div className='btn-group'>
                <button
                  className='btn btn-info'
                  onClick={() => {
                    props.dispatch({type: types.SET_CURRENT_PLAYING, songId: song.id})
                  }}
                >
                  <Translate value="common.play" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongView
