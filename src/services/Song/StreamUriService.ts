import Media from '../../entities/Media'

export const getStreamUri = (
  song: Media,
  settings: any,
  providerNum: number
): any => {
  const { proto, host, port } = settings.app.ipfs
  const prepend = song.stream &&
    song.stream[providerNum] &&
    song.stream[providerNum].service === 'ipfs' ? `${proto}://${host}:${port}/ipfs/` : ''

  const streamUri = song &&
    song.stream &&
      song.stream[providerNum] &&
      song.stream.length ?
      song.stream[providerNum].uris[0].uri: null

  return streamUri ? prepend + streamUri : null
}
