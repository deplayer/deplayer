// @flow

import React, { Component } from 'react'
import { Translate } from 'react-redux-i18n'
import { Redirect } from 'react-router-dom'

import Song from '../entities/Song'
import CoverImage from './MusicTable/CoverImage'
import { getDurationStr } from '../utils/timeFormatter'

type Props = {
  song: Song
}

export default class Track extends Component<Props> {
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
              albumName={song.album.name}
            />
          </div>
          <div className='content'>
            <div className='header'>
              <h1><span className='label'><Translate value='song.label.title' /></span>: { song.title }</h1>
              <p><span className='label'><Translate value='song.label.album' /></span>: { song.album.name }</p>
            </div>
            <div className='meta'><span className='label'><Translate value='song.label.artist' /></span>: { song.artist.name }</div>
            <div className='meta'><span className='label'><Translate value='song.label.duration' /></span>: { getDurationStr(song.duration) }</div>
            <div className='meta'><span className='label'><Translate value='song.label.genre' /></span>: { song.genre }</div>
          </div>
        </div>
      </div>
    )
  }
}
