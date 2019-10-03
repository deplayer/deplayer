import ipfsClient from 'ipfs-http-client'

export const scanFolder = async (hash: string, settings: any): Promise<any> => {
  console.log('scanning folder')
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

export const loadIPFSFile = async(file: any, ipfsSettings: any): Promise<any> => {
  console.log(file.path)
  if (!mediaExp.test(file.path)) {
    throw new Error('media not supported')
  }

  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })

  const fileContent = await ipfs.get(file.path)
  const contents = await fileContent.content.toString('utf8')

  return contents
}
