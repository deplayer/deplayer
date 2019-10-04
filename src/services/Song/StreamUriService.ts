import Song from '../../entities/Song'

export const getStreamUri = (song: Song): any => {
  const streamUri = song
    && song.stream
    && song.stream.length ?
      song.stream[0].uris[0].uri: null

  return streamUri
}
