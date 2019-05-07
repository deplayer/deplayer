import * as React from 'react'

type Props = {
  playlist: any
}

const Playlists = (props: Props) => {
  const { playlists } = props.playlist
  const playlistsComps = playlists.map((playlist) => {
    return (
      <li>{ playlist._id }</li>
    )
  })

  return (<ul>{ playlistsComps }</ul>)
}

export default Playlists
