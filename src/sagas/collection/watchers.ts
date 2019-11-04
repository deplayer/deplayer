import { call, actionChannel, fork, take, put } from 'redux-saga/effects'

import { initialize } from '../settings'
import { getAdapter } from '../../services/database'
import { saveToDbWorker } from './workers'
import CollectionService from '../../services/CollectionService'
import logger from '../../utils/logger'
import mapToMedia from '../../mappers/mapToMedia'
import * as types from '../../constants/ActionTypes'

const adapter = getAdapter()
const collectionService = new CollectionService(new adapter())

export function* addToCollectionWatcher(): any {
  const handleChannel = yield actionChannel(types.ADD_TO_COLLECTION)

  while (true) {
    const { data } = yield take(handleChannel)

    try {
      yield fork(saveToDbWorker, data)
      yield take([
        types.SAVE_COLLECTION_FULLFILLED,
        types.SAVE_COLLECTION_FAILED
      ])
      yield put({type: types.RECEIVE_COLLECTION_FINISHED})
    } catch(error) {
      yield put({type: 'ADD_TO_COLLECTION_HANDLER_FAILED', error})
    }
  }
}

// Application initialization routines
export function* initializeWatcher() {
  while (true) {
    yield take(types.INITIALIZE)
    yield call(initialize)
    yield call(collectionService.initialize)
    const collection = yield call(collectionService.getAll)
    const mappedData = mapToMedia(collection)
    yield put({type: types.RECEIVE_COLLECTION, data: mappedData})
    // FIXME: Handle RECEIVE_COLLECTION instead of call every time
    yield put({type: types.RECREATE_INDEX})
    yield put({type: types.INITIALIZED})
  }
}
