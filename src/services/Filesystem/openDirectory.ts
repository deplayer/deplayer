
import Filesystem from './index'

const openDialog = async (): Promise<any> => {
  const fs = Filesystem
  const selectedFiles = await fs.openDialog()
  const values = (selectedFiles.values && selectedFiles.values()) || selectedFiles

  console.log('selectedFiles: ', values)

  /**
  const files: Array<any> = []

  for await (const entry of values) {
    const file = await processSelectedFile(entry)
    files.push(file.file)
  }
  */

  return values
}

const processSelectedFile = async (entry: any): Promise<{
  file: any,
}> => {
  let file: any
  console.log('entry: ', entry)

  // const writable = await entry.createWritable()

  if (entry.kind === 'file') {
    file = await entry.getFile()
  } else {
    file = entry
  }
  const data = await new Response(file).text()

  return {
    file: { name: entry.name, contents: data }
  }
}

export default openDialog
