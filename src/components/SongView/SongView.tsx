import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Redirect } from 'react-router-dom'
import { Link } from 'react-router-dom'

import logger from '../../utils/logger'
import CoverImage from '../MusicTable/CoverImage'
import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  queue: any,
  song: any,
  className: string|null
}

const SongView = (props: Props) => {
  const { queue, song } = props

  if (!song || !song.id) {
    logger.log('SongView', 'Song not found redirecting to home ')
    return (
      <div>
        <Redirect to='/' />
      </div>
    )
  }

  return (
    <div className={`song-view ${props.className}`}>
      <div className='song'>
        <div className='image'>
          <CoverImage
            cover={song.cover}
            size='full'
            albumName={song.album ? song.album.name: 'N/A'}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongView
