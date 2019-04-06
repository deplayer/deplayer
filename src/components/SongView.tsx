import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Redirect } from 'react-router-dom'

import CoverImage from './MusicTable/CoverImage'
import { getDurationStr } from '../utils/timeFormatter'

type Props = {
  collection: any,
  match: any
}

export default class SongView extends React.Component<Props> {
  render() {
    const songId = this.props.match.params.id
    const song = this.props.collection.rows[songId]

    if (!song || !song.id) {
      return (
        <div>
          <Redirect to='/' />
        </div>
      )
    }

    return (
      <div className='song-view'>
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
                  <div className='collapsed'>
                    <span className='label'><Translate value='song.label.album' /></span>
                  </div>
                  <div>
                    { song.albumName || 'N/A' }
                  </div>
                </div>
                <div>
                  <div className='collapsed'>
                    <span className='label'><Translate value='song.label.artist' /></span>
                  </div>
                  <div>
                    { song.artist.name }
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
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }
}
