import * as musicMetadata from 'music-metadata'

import Media from '../../entities/Media'

export const readFileMetadata = async (file: any) => {
  const normFile = file.contents ? file.contents : file

  console.log('reading metadata from file: ', normFile)

  const metadata = await musicMetadata.parseBlob(normFile)
  console.log('file metadata: ', metadata)
  return metadata
}

export const getFileMetadata = async (file: any, settings: any) => {
  const { proto, host, port } = settings.app.ipfs
  const metadata = await musicMetadata.fetchFromUrl(`${proto}://${host}:${port}/ipfs/${file.path}`)
  return metadata
}

export const metadataToSong = (
  metadata: musicMetadata.IAudioMetadata,
  fileUri: string,
  service: string,
): Media => {
  const genre = metadata.common.genre ? metadata.common.genre.map((genre: any) => genre).join(', ') : ''
  const cover = metadata.common.picture ? metadata.common.picture[0] : null
  const song = new Media({
    title: metadata.common.title || fileUri,
    artist: { name: metadata.common.artist || '' },
    album: { name: metadata.common.album || '', artist: { name: metadata.common.artist || '' } },
    artistName: metadata.common.artist || '',
    albumName: metadata.common.album || '',
    type: fileUri.endsWith('.mp4') ? 'video' : 'audio',
    duration: metadata.format.duration || 0,
    genre: genre,
    stream: {
      filesystem: {
        service: service,
        uris: [
          {
            uri: fileUri
          }
        ]
      }
    }
  })

  return song
}
