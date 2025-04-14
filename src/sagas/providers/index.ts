import { call, put, takeLatest, takeEvery, select } from "redux-saga/effects";

import { getAdapter } from "../../services/database";
import {
  metadataToSong,
  readFileMetadata,
} from "../../services/ID3Tag/ID3TagService";
import { getSettings } from "../selectors";
import CollectionService from "../../services/CollectionService";
import YoutubeDlServerProvider from "../../providers/YoutubeDlServerProvider";
import * as types from "../../constants/ActionTypes";
import FileManager from "../../services/Filesystem/FileManager";
import providers from "../../providers";

const validExtensions = ["mp3", "mp4", "flac"];

// Watcher should enque tasks to avoid concurrency
function* startProvidersScan(): any {
  const settings = yield select(getSettings);

  const providerKeys = Object.keys(settings.providers).filter((key: string) => {
    return key.match(/ipfs|youtube-dl-server/);
  });

  for (const key of providerKeys) {
    if (key.match(/youtube-dl-server/)) {
      yield put({
        type: "START_YOUTUBE_DL_SERVER_SCAN",
        data: settings.providers[key],
        key,
      });
    }
  }
}

function getRelativePath(
  entry: FileSystemHandle,
  parent: FileSystemHandle
): string {
  let path = entry.name;
  path = parent.name + "/" + path;
  return path;
}

interface FileHandleTuple {
  file: any;
  handler: any;
}

function* getFilesRecursively(
  entry: FileSystemHandle
): Generator<any, FileHandleTuple[] | undefined, any> {
  if (entry instanceof FileSystemFileHandle) {
    const file = yield call([entry, entry.getFile]);
    if (file !== null) {
      file.relativePath = getRelativePath(file, entry);

      yield call(FileManager.processSelectedFile, entry);

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

    return results;
  }
}

// Handle filesystem adding
function* startFilesystemProcess(action: any): any {
  console.log("processing filesystem files: ", action.files);

  for (const file of action.files) {
    // Recursive call for directories
    if (file.file.kind === "directory") {
      const files = yield* getFilesRecursively(file.file);

      yield put({
        type: types.START_FILESYSTEM_FILES_PROCESSING,
        files: files,
      });

      break;
    }

    if (validExtensions[file.file.extension]) {
      break;
    }

    try {
      const metadata = yield call(readFileMetadata, file.file);

      const song = yield call(
        metadataToSong,
        metadata,
        file.handler.name,
        "filesystem"
      );
      console.log("saving song: ", song);

      const adapter = getAdapter();
      const collectionService = new CollectionService(adapter);

      // Save song
      const songDocument = song.toDocument();
      yield call(collectionService.save, song.id, songDocument);
      yield put({ type: types.ADD_TO_COLLECTION, data: [songDocument] });
      yield put({ type: types.RECEIVE_COLLECTION, data: [songDocument] });

      yield put({ type: types.FILESYSTEM_SONG_LOADED, songDocument });
      yield put({
        type: types.SEND_NOTIFICATION,
        notification: song.title + " - " + song.artistName + " saved",
        level: "info",
      });
    } catch (error) {
      console.error("error reading metadata: ", error);
    }
  }
}

function* startYoutubeDlScan(action: any): Generator<any, void, any> {
  try {
    const settings = yield select(getSettings);
    const service = new YoutubeDlServerProvider(
      settings.app["youtube-dl-server"],
      action.key
    );

    const result = yield service.search(action.data.url);
    yield put({ type: types.ADD_TO_COLLECTION, data: result });
  } catch (error) {
    yield put({ type: "YOUTUBE_FETCH_ERROR", error });
  }
}

function* startProviderSync(action: any): Generator<any, void, any> {
  try {
    // Extract base provider type from the key (e.g. "subsonic" from "subsonic1")
    const providerType = action.providerKey.replace(/\d+$/, '');
    
    const ProviderClass = providers[
      providerType as keyof typeof providers
    ];
    
    if (!ProviderClass) {
      throw new Error(`Provider type ${providerType} not found`);
    }

    // Get settings for this specific provider instance
    const settings = yield select(getSettings);
    const providerSettings = settings.providers[action.providerKey];
    
    if (!providerSettings) {
      throw new Error(`Settings not found for provider ${action.providerKey}`);
    }

    // Instantiate the provider with its settings
    const provider = new ProviderClass(providerSettings, action.providerKey);

    // Type guard to check if provider supports fullSync
    if (!('fullSync' in provider)) {
      throw new Error("Provider does not support full sync");
    }

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Starting full sync with ${action.providerKey}`,
      level: "info",
    });

    const songs = yield call([provider, (provider as any).fullSync]);

    yield put({ type: types.ADD_TO_COLLECTION, data: songs });
    yield put({
      type: types.PROVIDER_SYNC_FINISHED,
      providerKey: action.providerKey,
    });

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Sync completed with ${action.providerKey}. Added ${songs.length} songs.`,
      level: "success",
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    yield put({
      type: types.PROVIDER_SYNC_FAILED,
      providerKey: action.providerKey,
      error: error.message,
    });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Sync failed with ${action.providerKey}: ${error.message}`,
      level: "error",
    });
  }
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan);
  yield takeEvery(types.START_YOUTUBE_DL_SERVER_SCAN, startYoutubeDlScan);
  yield takeLatest(
    types.START_FILESYSTEM_FILES_PROCESSING,
    startFilesystemProcess
  );
  yield takeLatest(types.START_PROVIDER_SYNC, startProviderSync);
}

export default providersSaga;
