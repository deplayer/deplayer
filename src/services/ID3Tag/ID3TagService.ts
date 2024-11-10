import * as musicMetadata from 'music-metadata'
import { writeFile } from '@happy-js/happy-opfs'

import Media, { IMedia, Cover } from '../../entities/Media'

export const readFileMetadata = async (file: any) => {
  const normFile = file.contents ? file.contents : file

  console.log('reading metadata from file: ', normFile)

  const metadata = await musicMetadata.parseBlob(normFile)
  console.log('file metadata: ', metadata)
  return metadata
}

export async function metadataToSong(
  metadata: musicMetadata.IAudioMetadata,
  fileUri: string,
  service: string,
): Promise<Media> {
  const genre = metadata.common.genre ? metadata.common.genre.map((genre: string) => genre).join(', ') : ''
  const cover = metadata.common.picture ? metadata.common.picture[0] : null

  let mediaProps: IMedia = {
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
  }

  if (cover?.data) {
    const coverFsUri = `/${fileUri}/${cover.type}.jpeg`
    console.log(`cover:`, cover)
    await writeFile(coverFsUri, cover.data)

    const mediaCover: Cover = { thumbnailUrl: coverFsUri, fullUrl: coverFsUri }
    mediaProps = { ...mediaProps, cover: mediaCover }
  }

  const song = new Media(mediaProps)

  return song
}
