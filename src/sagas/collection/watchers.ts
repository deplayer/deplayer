import { call, actionChannel, fork, take, put } from 'redux-saga/effects'

import { saveToDbWorker } from './workers'
import { getAdapter } from '../../services/database'
import { initialize } from '../settings'
import CollectionService from '../../services/CollectionService'
import * as types from '../../constants/ActionTypes'
import { generateIndexWorker } from './workers'
import IndexService from '../../services/Search/IndexService'

const adapter = getAdapter()
const collectionService = new CollectionService(adapter)

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
      yield put({ type: types.RECEIVE_COLLECTION_FINISHED })
    } catch (error) {
      yield put({ type: 'ADD_TO_COLLECTION_HANDLER_FAILED', error })
    }
  }
}

// Application initialization routines
export function* initializeWatcher(): Generator<any, void, any> {
  while (true) {
    yield take(types.INITIALIZE)
    yield call(initialize)
    yield call(collectionService.initialize)
    const collection = yield call(collectionService.getAll)
    const mappedData = collection.map((elem: any) => elem)

    yield put({ type: types.RECEIVE_COLLECTION, data: mappedData })

    const indexService = IndexService()
    yield fork(generateIndexWorker, indexService)

    yield put({ type: types.INITIALIZED })
    yield put({ type: types.APPLY_MOST_PLAYED_SORT })
  }
}
