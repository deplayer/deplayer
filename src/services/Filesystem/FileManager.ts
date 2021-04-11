import Filesystem from './index'
import { get, set } from 'idb-keyval'


const FileManager = () => {
  let directoryHandler: any
  const fileHandlers: Array<any> = []

  const openDialog = async (): Promise<any> => {
    directoryHandler = await Filesystem.openDialog()
    set('directoryHandler', directoryHandler)
    const values = (directoryHandler.values && directoryHandler.values()) || directoryHandler

    console.log('directoryHandler: ', directoryHandler)

    const files: Array<any> = []

    for await (const entry of values) {
      fileHandlers.push(entry)

      const file = await processSelectedFile(entry)
      files.push(file)
    }

    return files
  }

  const processSelectedFile = async (entry: any): Promise<{
    file: any,
    handler: any
  }> => {
    let file: any

    console.log(`saving handler ${entry.name} for later use`)

    if (entry.kind === 'file') {
      await set(entry.name, entry)
      file = await entry.getFile()
    } else {
      file = entry
      await set(file.name, file)
    }

    return {
      file: file,
      handler: entry
    }
  }

  return {
    openDialog
  }
}

const fileManager = FileManager()

export default fileManager
