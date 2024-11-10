import {
  call,
  put,
  takeLatest,
  takeEvery,
  select
} from 'redux-saga/effects'

import { getAdapter } from '../../services/database'
import { metadataToSong, readFileMetadata } from '../../services/ID3Tag/ID3TagService'
import { getSettings } from '../selectors'
import CollectionService from '../../services/CollectionService'
import YoutubeDlServerProvider from '../../providers/YoutubeDlServerProvider'
import * as types from '../../constants/ActionTypes'
import FileManager from '../../services/Filesystem/FileManager'

// Watcher should enque tasks to avoid concurrency
export function* startProvidersScan(): any {
  const settings = yield select(getSettings)

  const providerKeys = Object.keys(settings.providers).filter((key: string) => {
    return key.match(/ipfs|youtube-dl-server/)
  })

  for (const key of providerKeys) {
    if (key.match(/youtube-dl-server/)) {
      yield put({ type: 'START_YOUTUBE_DL_SERVER_SCAN', data: settings.providers[key], key })
    }

    if (key.match(/ipfs/)) {
      const ipfsSettings = settings.providers[key]
      yield put({ type: 'PROVIDER_SCAN_STARTED', key })

      const { hash } = ipfsSettings

      yield put({
        type: types.SEND_NOTIFICATION,
        notification: `starting to scan hash: ${hash}`,
        level: 'info'
      })

      // Dispatching an event with configured ipfs hash
      yield put({ type: types.IPFS_FOLDER_FOUND, hash })
      yield put({ type: 'PROVIDER_SCAN_FINISHED', key })
    }
  }
}

function getRelativePath(entry: FileSystemHandle, parent: FileSystemHandle): string {
  let path = entry.name
  path = parent.name + '/' + path
  return path
}

interface FileHandleTuple {
  file: any,
  handler: any
}

function* getFilesRecursively(entry: FileSystemHandle): Generator<any, FileHandleTuple[] | undefined, any> {
  if (entry instanceof FileSystemFileHandle) {
    const file = yield call([entry, entry.getFile]);
    if (file !== null) {
      file.relativePath = getRelativePath(file, entry);

      yield call(FileManager.processSelectedFile, entry)

      return yield file;
    }
  } else if (entry instanceof FileSystemDirectoryHandle) {
    const asyncIterator = entry.values();

    const results = [];
    while (true) {
      const fileResult = yield call([asyncIterator, asyncIterator.next]);
      if (fileResult.done || !fileResult.value) {
        break;
      }

      const handle = fileResult.value;
      if (handle !== null) {
        const result = yield* getFilesRecursively(handle);
        results.push({ file: result, handler: handle });
      }
    }

    return results
  }
}

// Handle filesystem adding
export function* startFilesystemProcess(action: any): any {
  console.log('processing filesystem files: ', action.files)

  for (const file of action.files) {
    // Recursive call for directories
    if (file.file.kind === 'directory') {
      const files = yield* getFilesRecursively(file.file)

      yield put({ type: types.START_FILESYSTEM_FILES_PROCESSING, files: files })

      break
    }

    const metadata = yield call(readFileMetadata, file.file)
    const song = yield call(metadataToSong, metadata, file.handler.name, 'filesystem')

    console.log('saving song: ', song)

    const adapter = getAdapter()
    const collectionService = new CollectionService(adapter)

    // Save song
    const songDocument = song.toDocument()
    yield call(collectionService.save, song.id, songDocument)
    yield put({ type: types.ADD_TO_COLLECTION, data: [songDocument] })
    yield put({ type: types.RECEIVE_COLLECTION, data: [songDocument] })

    yield put({ type: types.FILESYSTEM_SONG_LOADED, songDocument })
    yield put({
      type: types.SEND_NOTIFICATION, notification: song.title + ' - ' + song.artistName + ' saved',
      level: 'info'
    })
  }

  yield put({ type: types.RECREATE_INDEX })
}

function* startYoutubeDlScan(action: any): Generator<any, void, any> {
  try {
    const settings = yield select(getSettings)
    const service = new YoutubeDlServerProvider(
      settings.app['youtube-dl-server'],
      action.key
    )

    const result = yield service.search(action.data.url)
    yield put({ type: types.ADD_TO_COLLECTION, data: result })
    yield put({ type: types.RECREATE_INDEX })
  } catch (error) {
    yield put({ type: 'YOUTUBE_FETCH_ERROR', error })
  }
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
  yield takeEvery(types.START_YOUTUBE_DL_SERVER_SCAN, startYoutubeDlScan)
  yield takeLatest(types.START_FILESYSTEM_FILES_PROCESSING, startFilesystemProcess)
}

export default providersSaga
