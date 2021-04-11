import Media from '../../entities/Media'

export const getStreamUri = async (
  song: Media,
  settings: any,
  providerNum: number
): any => {
  const { proto, host, port } = settings.app.ipfs
  const prepend = song.stream &&
    song.stream[providerNum] &&
    song.stream[providerNum].service === 'ipfs' ? `${proto}://${host}:${port}/ipfs/` : ''

  const streamUri = song &&
      song?.stream[providerNum] &&
      song.stream.length ?
      song.stream[providerNum].uris[0].uri: null

  console.log(song)
  console.log(streamUri)

  verifyPermission(streamUri)

  if (streamUri?.getFile) {
    const file = await streamUri.getFile()
    console.log('file:', file)
    return URL.createObjectURL(file)
  }

  return streamUri ? prepend + streamUri : null
}

async function verifyPermission(fileHandle: any, readWrite = false) {
  const options = {};
  if (readWrite) {
    // options.mode = 'readwrite';
  }

  if (!fileHandle?.queryPermission) {
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
