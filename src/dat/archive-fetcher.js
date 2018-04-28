import { isTrack } from './format-utils'

const DatArchive = window.DatArchive
let archive
const files = []

export const fetchPlaylist = (libraryDat) => {
  archive = new DatArchive(libraryDat)
  console.log(archive)
  readFolder()
}

const readFolder = (folder = '/') => {
  console.log(isTrack(folder))
  if (isTrack(folder)) {
    return addFile(folder)
  }

  archive.readdir(folder).then((files) => {
    files.forEach((file) => {
      if (folder === '/') {
        readFolder(folder + file)
      } else {
        readFolder(folder + '/' + file)
      }
    })
  })
    .catch((e) => {
      console.error('Error reading folder %s', folder)
      console.error(e)
    })
}

const addFile = (file) => {
  console.info('Enqueing %s', file)
  files.push(file)
}
