import {
  call,
  takeEvery,
  select,
  put
} from 'redux-saga/effects'
import { readTextFile, writeFile } from '@happy-js/happy-opfs'

import * as types from '../../constants/ActionTypes'

type PinAction = {
  type: string,
  songId: string,
}

async function storeSongData(song: any) {
  const songFsUri = `/${song.id}`
  await writeFile(songFsUri, song)
  const fileContents = await readTextFile(songFsUri)
  console.log(fileContents.unwrap())
}

function* pinSong(action: PinAction): any {
  const song = select(getState => getState().songs[action.songId])
  yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.pining_song' })
  yield call(storeSongData, song)
}

// Binding actions to sagas
function* pinSaga(): any {
  yield takeEvery(types.PIN_SONG, pinSong)
}

export default pinSaga
