import * as musicMetadata from 'music-metadata-browser';

import Song from '../../entities/Song'

export const getFileMetadata = async (file: any, settings: any) => {
  const ipfsGateway = settings.settings.app.ipfs.gateway
  const metadata = await musicMetadata.fetchFromUrl(`${ipfsGateway}/ipfs/${file.path}`)
  return metadata
}

export const metadataToSong = (
  metadata: musicMetadata.IAudioMetadata,
  file: any
): Song => {
  const song = new Song({
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
