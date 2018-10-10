// @flow

import React, { Component } from 'react'
import { Translate } from 'react-redux-i18n'
import { Redirect } from 'react-router-dom'
import { Table } from 'semantic-ui-react'

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
              albumName={song.album.name}
            />
          </div>
          <div className='content'>

            <ShareButtons song={song} />

            <Table inverted size='large'>
              <Table.Body>
                <Table.Row>
                  <Table.Cell className='collapsed'>
                    <span className='label'><Translate value='song.label.title' /></span>
                  </Table.Cell>
                  <Table.Cell>
                    { song.title }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className='collapsed'>
                    <span className='label'><Translate value='song.label.album' /></span>
                  </Table.Cell>
                  <Table.Cell>
                    { song.album.name }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className='collapsed'>
                    <span className='label'><Translate value='song.label.artist' /></span>
                  </Table.Cell>
                  <Table.Cell>
                    { song.artist.name }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className='collapsed'>
                    <span className='label'><Translate value='song.label.duration' /></span>
                  </Table.Cell>
                  <Table.Cell>
                    { getDurationStr(song.duration) }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className='collapsed'>
                    <span className='label'><Translate value='song.label.genre' /></span>
                  </Table.Cell>
                  <Table.Cell>
                    { song.genre }
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>

          </div>
        </div>
      </div>
    )
  }
}
