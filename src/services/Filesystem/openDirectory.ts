
import Filesystem from './index'

const openDialog = async (): Promise<any> => {
  const fs = Filesystem
  const selectedFiles = await fs.openDialog()
  const values = (selectedFiles.values && selectedFiles.values()) || selectedFiles

  console.log('selectedFiles: ', selectedFiles)

  const files: Array<any> = []

  for await (const entry of values) {
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

  if (entry.kind === 'file') {
    file = await entry.getFile()
  } else {
    file = entry
  }

  return {
    file: file,
    handler: entry
  }
}

export default openDialog
