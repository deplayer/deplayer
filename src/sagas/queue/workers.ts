import { put, call } from 'redux-saga/effects'
import { getAdapter } from '../../services/database'
import QueueService from '../../services/QueueService'
import logger from '../../utils/logger'
import * as types from '../../constants/ActionTypes'

const adapter = getAdapter()
const queueService = new QueueService(adapter)

// Application initialization routines
export function* initialize(): Generator<any, void, unknown> {
  yield queueService.initialize
  logger.log('queue-saga', 'initializing queue')

  try {
    const queue = yield call(queueService.get)
    if (!queue) {
      logger.log('queue-saga', 'error retrieving queue', queue)
      yield put({ type: types.GET_QUEUE_REJECTED })
    } else {
      const unserialized = JSON.parse(JSON.stringify(queue))
      logger.log('queue-saga', 'queue recieved and unserialized')
      yield put({ type: types.RECEIVE_QUEUE, queue: unserialized })
    }
  } catch (e: any) {
    yield put({ type: types.GET_QUEUE_REJECTED, error: e.message })
  }
}

