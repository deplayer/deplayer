import ipfsClient from 'ipfs-http-client'

export const scanFolder = async (hash: string, settings: any): Promise<any> => {
  const ipfsSettings = settings.settings.providers['ipfs1']
  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })

  const files = await ipfs.ls(hash)
  return files
}

const mediaExp = new RegExp(/.*(.mp3|.wav|.avi)$/)

export const loadIPFSFile = async(file: any, settings: any): Promise<any> => {
  const ipfsSettings = settings.settings.providers['ipfs1']
  if (!mediaExp.test(file.path)) {
    throw new Error('media not supported')
  }

  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })

  const fileContent = await ipfs.get(file.path)

  const contents = await fileContent[0].content.toString('utf8')

  return contents
}

