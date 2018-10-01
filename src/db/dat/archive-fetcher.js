import { isTrack } from './format-utils'

const DatArchive = window.DatArchive
let archive
let files = []

if (localStorage.getItem('files')) {
  files = JSON.parse(localStorage.getItem('files'))
}

export const fetchPlaylist = (libraryDat) => {
  archive = new DatArchive(libraryDat)
  console.log(archive)
  readFolder()
}

const readFolder = (folder = '/') => {
  archive.readdir(folder).then((retrievedFiles) => {
    retrievedFiles.forEach((file) => {
      let fullPath

      if (folder === '/') {
        fullPath = folder + file
      } else {
        fullPath = folder + '/' + file
      }

      // We dont want to exec a query if we have saved this track previously
      if (fileInCollection(file)) {
        return
      }

      archive.stat(fullPath).then((stat) => {
        if (stat.isFile()) {
          if (isTrack(fullPath)) {
            return addFile(fullPath)
          }
        } else {
          readFolder(fullPath)
        }
      })
        .catch((e) => {
          console.error('Error stating file %s', fullPath)
          console.error(e)
        })
    })
  })
    .catch((e) => {
      console.error('Error reading folder %s', folder)
      console.error(e)
    })
}

const addFile = (file) => {
  if (fileInCollection(file)) {
    return
  }

  console.log('Adding %s', file)

  files.push(file)
  localStorage.setItem('files', JSON.stringify(files))
}

const fileInCollection = (file) => {
  if (file && files.indexOf(file) > -1) {
    return true
  }

  return false
}
