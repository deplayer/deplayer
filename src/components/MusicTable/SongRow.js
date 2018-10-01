// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'

import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import CoverImage from './CoverImage'

type Props = {
  song: Song,
  onClick: () => any
}

const SongRow = (props: Props) => {
  const { song, onClick } = props
  return (
    <Table.Row
      className='song-row'
      onClick={onClick}
    >
      <Table.Cell className='collapsing'>
        <CoverImage song={song} />
      </Table.Cell>
      <Table.Cell>{ song.title }</Table.Cell>
      <Table.Cell>{ song.album.name }</Table.Cell>
      <Table.Cell>{ song.artist.name }</Table.Cell>
      <Table.Cell>{ song.artist.name }</Table.Cell>
      <Table.Cell>{ getDurationStr(song.duration) }</Table.Cell>
      <Table.Cell>{ song.genre }</Table.Cell>
      <Table.Cell>{ song.price.price + song.price.currency }</Table.Cell>
    </Table.Row>
  )
}

export default SongRow
