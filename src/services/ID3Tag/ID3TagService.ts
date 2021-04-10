import * as musicMetadata from 'music-metadata-browser'

import Media from '../../entities/Media'

export const readFileMetadata = async (file: any) => {
  const metadata = await musicMetadata.parseBlob(file)
  console.log('metadata: ', metadata)
  return metadata
}

export const getFileMetadata = async (file: any, settings: any) => {
  const { proto, host, port } = settings.app.ipfs
  const metadata = await musicMetadata.fetchFromUrl(`${proto}://${host}:${port}/ipfs/${file.path}`)
  return metadata
}

export const metadataToSong = (
  metadata: musicMetadata.IAudioMetadata,
  fileUri: any,
  service: string
): Media => {
  const song = new Media({
    title: metadata.common.title || fileUri?.name,
    artistName:  metadata.common.artist,
    // FIXME: genre is an array, we should extract only if its defined
    // genre: metadata.common.genre,
    albumName: metadata.common.album,
    stream: [
      {
        // FIXME: This could be anything
        service: service,
        uris: [
          {
            // FIXME: Make it configurable
            uri: fileUri,
            quality: 'unknown'
          }
        ]
      }
    ]
  })

  return song
}
