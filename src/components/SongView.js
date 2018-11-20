// @flow

import React, { Component } from 'react'
import { Translate } from 'react-redux-i18n'
import { Redirect } from 'react-router-dom'

import Song from '../entities/Song'
import CoverImage from './MusicTable/CoverImage'
import ShareButtons from './ShareButtons'
import { getDurationStr } from '../utils/timeFormatter'

type Props = {
  song: Song
}

export default class Rowack extends Component<Props> {
  render() {
    const { song } = this.props

    if (!song.id) {
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

            <ShareButtons song={song} />

            <div inverted size='large'>
              <div>
                <div>
                  <div className='collapsed'>
                    <span className='label'><Translate value='song.label.title' /></span>
                  </div>
                  <div>
                    { song.title }
                  </div>
                </div>
                <div>
                  <div className='collapsed'>
                    <span className='label'><Translate value='song.label.album' /></span>
                  </div>
                  <div>
                    { song.album.name }
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
