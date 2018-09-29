// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'

import Song from '../../entities/Song'

type Props = {
  song: Song
}

const SongRow = (props: Props) => {
  const { song } = props
  return (
    <Table.Row className='song-row'>
      <Table.Cell>{ song.artist.name }</Table.Cell>
      <Table.Cell>{ song.title }</Table.Cell>
    </Table.Row>
  )
}

export default SongRow
