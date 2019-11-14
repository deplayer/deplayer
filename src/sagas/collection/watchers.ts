import { call, actionChannel, fork, take, put } from 'redux-saga/effects'

import { initialize } from '../settings'
import { getAdapter } from '../../services/database'
import { saveToDbWorker } from './workers'
import CollectionService from '../../services/CollectionService'
import logger from '../../utils/logger'
import mapToMedia from '../../mappers/mapToMedia'
import * as types from '../../constants/ActionTypes'

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} Array to split
 * @param chunkSize {Integer} Size of every group
 */
const chunkArray = (myArray: Array<any>, chunk_size: number) => {
    const results: Array<any> = []

    while (myArray.length) {
      results.push(myArray.splice(0, chunk_size))
    }

    return results
}

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

    const chunks = chunkArray(mappedData, 100)
    for (let i = 0; i < chunks.length; i++) {
      yield put({type: types.RECEIVE_COLLECTION, data: chunks[i]})
    }

    yield put({type: types.INITIALIZED})
    yield put({type: types.RECREATE_INDEX})
  }
}
