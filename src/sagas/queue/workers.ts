import { put, call } from 'redux-saga/effects'
import { getAdapter } from '../../services/database'
import QueueService from '../../services/QueueService'
import { createLogger } from '../../utils/logger'
import * as types from '../../constants/ActionTypes'

const adapter = getAdapter()
const queueService = new QueueService(adapter)
const logger = createLogger({ namespace: 'queue-saga' })

// Default empty queue state
const defaultQueue = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: null,
  repeat: false,
  shuffle: false,
  nextSongId: null,
  prevSongId: null
}

// Application initialization routines
export function* initialize(): Generator<any, void, unknown> {
  yield queueService.initialize
  logger.debug('Initializing queue')

  try {
    const queue = yield call(queueService.get)
    
    if (!queue) {
      logger.debug('No queue found, initializing with empty state')
      yield put({ type: types.RECEIVE_QUEUE, queue: defaultQueue })
      return
    }

    const unserialized = JSON.parse(JSON.stringify(queue))
    if (!unserialized || !Array.isArray(unserialized) || unserialized.length === 0) {
      logger.debug('Empty queue found, initializing with empty state')
      yield put({ type: types.RECEIVE_QUEUE, queue: defaultQueue })
      return
    }

    logger.debug('Queue received and unserialized')
    yield put({ type: types.RECEIVE_QUEUE, queue: unserialized[0] })
  } catch (e: any) {
    logger.error('Error initializing queue:', e)
    yield put({ type: types.GET_QUEUE_REJECTED, error: e.message })
    // Initialize with empty state on error
    yield put({ type: types.RECEIVE_QUEUE, queue: defaultQueue })
  }
}

