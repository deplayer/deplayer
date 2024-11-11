import * as musicMetadata from 'music-metadata'
import { writeFile } from '@happy-js/happy-opfs'

import Media, { IMedia, Cover } from '../../entities/Media'

function generateHexHash(length: number = 16): string {
  let hash = '';
  for (let i = 0; i < length; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  return hash;
}

const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',           // MP3
  'audio/mp4',           // M4A, AAC
  'audio/ogg',           // OGG
  'audio/wav',           // WAV
  'audio/flac',          // FLAC
  'audio/x-flac',        // FLAC (alternative)
  'audio/webm',          // WEBM
  'video/mp4',           // MP4
  'video/webm',          // WEBM video
];

export const readFileMetadata = async (file: any) => {
  const normFile = file.contents ? file.contents : file
  
  // Check if file type is supported
  if (!normFile.type || !SUPPORTED_MIME_TYPES.includes(normFile.type)) {
    throw new Error(`Unsupported file type: ${normFile.type || 'unknown'}. Supported types are: ${SUPPORTED_MIME_TYPES.join(', ')}`)
  }

  console.log('reading metadata from file: ', normFile)

  try {
    const metadata = await musicMetadata.parseBlob(normFile)
    console.log('file metadata: ', metadata)
    return metadata
  } catch (error) {
    throw new Error(`Failed to parse metadata: ${error.message}`)
  }
}

export async function metadataToSong(
  metadata: musicMetadata.IAudioMetadata,
  fileUri: string,
  service: string,
): Promise<Media> {
  const cover = metadata.common.picture ? metadata.common.picture[0] : null

  console.log('metadata.common.genre: ', metadata.common.genre)

  let mediaProps: IMedia = {
    title: metadata.common.title || fileUri,
    artist: { name: metadata.common.artist || '' },
    album: { name: metadata.common.album || '', artist: { name: metadata.common.artist || '' } },
    artistName: metadata.common.artist || '',
    albumName: metadata.common.album || '',
    type: fileUri.endsWith('.mp4') ? 'video' : 'audio',
    duration: metadata.format.duration || 0,
    genres: metadata.common.genre ?? [],
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
  }

  if (cover?.data) {
    const fileName = generateHexHash(10)
    const coverFs = `/opfs-${fileName}.jpeg`
    await writeFile(coverFs, cover.data)

    const mediaCover: Cover = { thumbnailUrl: coverFs, fullUrl: coverFs }
    mediaProps = { ...mediaProps, cover: mediaCover }
  }

  const song = new Media(mediaProps)

  return song
}
