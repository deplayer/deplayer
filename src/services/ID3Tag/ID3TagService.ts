import * as musicMetadata from 'music-metadata-browser'

import Media from '../../entities/Media'

export const getFileMetadata = async (file: any, settings: any) => {
  const { proto, host, port } = settings.app.ipfs
  const metadata = await musicMetadata.fetchFromUrl(`${proto}://${host}:${port}/ipfs/${file.path}`)
  return metadata
}

export const metadataToSong = (
  metadata: musicMetadata.IAudioMetadata,
  file: any
): Media => {
  const song = new Media({
    title: metadata.common.title,
    artistName:  metadata.common.artist,
    // FIXME: genre is an array, we should extract only if its defined
    // genre: metadata.common.genre,
    albumName: metadata.common.album,
    stream: [
      {
        // FIXME: This could be anything
        service: 'ipfs',
        uris: [
          {
            // FIXME: Make it configurable
            uri: `${file.hash}`,
            quality: 'unknown'
          }
        ]
      }
    ]
  })

  return song
}
