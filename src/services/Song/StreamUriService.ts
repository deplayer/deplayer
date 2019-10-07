import Song from '../../entities/Song'

export const getStreamUri = (song: Song, settings: any): any => {
  const ipfsGateway = settings.settings.app.ipfs.gateway
  const prepend = song.stream && song.stream[0].service === 'ipfs' ? ipfsGateway + '/ipfs/' : ''

  const streamUri = song
    && song.stream
    && song.stream.length ?
      song.stream[0].uris[0].uri: null

  return prepend + streamUri
}
