import Media from '../../entities/Media'
import { get } from 'idb-keyval'

export const getStreamUri = async (
  song: Media,
  settings: any,
  providerNum: number
): Promise<string> => {
  const { proto, host, port } = settings.app.ipfs

  console.log('providerNum', providerNum)
  console.log('song', song)

  const service = song.stream && song.stream[providerNum] && song.stream[providerNum].service

  if (!service) {
    return ''
  }

  const prepend = service === 'ipfs' ? `${proto}://${host}:${port}/ipfs/` : ''

  const streamUri = song &&
      song.stream.length ?
      song.stream[providerNum] &&
      song.stream[providerNum].uris[0].uri: null

  const directoryHandler = await get('directoryHandler')
  await verifyPermission(directoryHandler)

  if (service === 'filesystem') {
    console.log('streamUri: ', streamUri)
    const handler = await get(streamUri)

    if (handler instanceof File) {
      return URL.createObjectURL(handler)
    }

    if (!handler.getFile) {
      return streamUri
    }

    await verifyPermission(handler)

    console.log('streamUri: ', streamUri)

    const file = await handler.getFile()

    if (!file) {
      return streamUri
    }

    console.log('file:', file)
    return URL.createObjectURL(file)
  }

  return prepend + streamUri
}

async function verifyPermission(fileHandle: any, readWrite = false) {
  const options = {};
  if (readWrite) {
    // options.mode = 'readwrite';
  }

  if (!fileHandle || !fileHandle.queryPermission) {
    return
  }

  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  // The user didn't grant permission, so return false.
  return false;
}
