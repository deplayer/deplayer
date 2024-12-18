import { IMedia } from '../../entities/Media'
import { get } from 'idb-keyval'
import { readFile } from '@happy-js/happy-opfs'
import { verifyPermission } from '../FileSystemService'

async function handleOpfs(streamUri: string | null) {
  if (!streamUri) {
    return ''
  }

  console.log('Starting OPFS reading')

  const fixedStreamUri = streamUri?.replace('opfs://', '/')

  const file = await readFile(fixedStreamUri)
  const fileArrayBuffer = file.unwrap()

  const blob = new Blob([fileArrayBuffer], { type: "audio/mpeg" })

  return URL.createObjectURL(blob)
}

async function handleFilesystem(streamUri: string | null) {
  console.log('Processing filesystem streamUri', streamUri)
  const directoryHandler = await get('directoryHandler')
  await verifyPermission(directoryHandler)

  console.log('directoryHandler', directoryHandler)

  if (!streamUri) {
    return ''
  }

  const handler = await get(streamUri)

  if (handler instanceof File) {
    console.log('handler is a File', handler)

    return URL.createObjectURL(handler)
  }

  if (!handler.getFile) {
    return streamUri
  }

  console.log('Verifying file permission')
  await verifyPermission(handler)

  console.log('Getting file from handler', handler)
  const file = await handler.getFile()

  console.log('file', file)
  if (!file) {
    return streamUri
  }

  return URL.createObjectURL(file)
}


export const getStreamUri = async (
  song: IMedia,
  settings: any,
  providerNum: number
): Promise<string | Blob> => {
  const service = song.stream && Object.values(song.stream)[providerNum] && Object.values(song.stream)[providerNum].service

  if (!service) {
    return ''
  }

  const { proto, host, port } = settings.app.ipfs
  const prepend = service === 'ipfs' ? `${proto}://${host}:${port}/ipfs/` : ''

  const streamUri = song &&
    Object.values(song.stream).length ?
    Object.values(song.stream)[providerNum] &&
    Object.values(song.stream)[providerNum].uris[0].uri : null

  if (service === 'filesystem') {
    return await handleFilesystem(streamUri)
  }

  if (service === 'opfs') {
    return await handleOpfs(streamUri)
  }

  return prepend + streamUri
}
