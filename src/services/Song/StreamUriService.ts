import Song from '../../entities/Song'

export const getStreamUri = (song: Song, settings: any): any => {
  const { proto, host, port } = settings.app.ipfs
  const prepend = song.stream && song.stream[0].service === 'ipfs' ? `${proto}://${host}:${port}/ipfs/` : ''

  const streamUri = song
    && song.stream
    && song.stream.length ?
      song.stream[0].uris[0].uri: null

  return prepend + streamUri
}
