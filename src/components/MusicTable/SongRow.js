// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'

import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import CoverImage from './CoverImage'

type Props = {
  song: Song,
  onClick: () => any
}

const SongRow = (props: Props) => {
  const { song, onClick } = props
  const nonAvailable = <Translate value='song.row.na' />
  return (
    <Table.Row
      className='song-row'
      onClick={onClick}
    >
      <Table.Cell className='collapsing'>
        <CoverImage cover={song.cover} size='thumbnail' albumName={song.album.name} />
      </Table.Cell>
      <Table.Cell>{ song.title }</Table.Cell>
      <Table.Cell>{ song.album ? song.album.name: nonAvailable }</Table.Cell>
      <Table.Cell>{ song.artist ? song.artist.name: nonAvailable }</Table.Cell>
      <Table.Cell>{ song.artist ? song.artist.name: nonAvailable }</Table.Cell>
      <Table.Cell>{ getDurationStr(song.duration) }</Table.Cell>
      <Table.Cell>{ song.genre }</Table.Cell>
      <Table.Cell>{ song.price ? song.price.price + song.price.currency: nonAvailable }</Table.Cell>
    </Table.Row>
  )
}

export default SongRow
