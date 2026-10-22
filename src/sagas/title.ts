import { takeLatest } from 'redux-saga/effects'
import type { SagaIterator } from 'redux-saga'

import type { MediaRow } from '../types/media'
import * as types from '../constants/ActionTypes'

function setDocumentTitle({ media }: { type: string; media: MediaRow }): void {
  if (media.title) {
    const artistName = media.artistName || 'Unknown Artist'
    document.title = `${media.title} - ${artistName}`
  }
}

// Binding actions to sagas
function* titleSaga(): SagaIterator {
  yield takeLatest(types.TRACK_STARTED, setDocumentTitle)
}

export default titleSaga
