// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'

import Song from '../../entities/Song'

type Props = {
  song: Song
}

const CoverImage = (props: any) => {
  if (props.song.cover.thumbnailUrl) {
    return (
      <img
        alt={ `${props.song.album.name} cover` }
        src={ props.song.cover.thumbnailUrl }
      />
    )
  }

  return (
    <img
      alt='Placeholder cover'
      src='https://via.placeholder.com/70x70'
    />
  )
}

const SongRow = (props: Props) => {
  const { song } = props
  return (
    <Table.Row className='song-row'>
      <Table.Cell className='collapsing'>
        <CoverImage song={song} />
      </Table.Cell>
      <Table.Cell>{ song.title }</Table.Cell>
      <Table.Cell>{ song.album.name }</Table.Cell>
      <Table.Cell>{ song.artist.name }</Table.Cell>
    </Table.Row>
  )
}

export default SongRow
