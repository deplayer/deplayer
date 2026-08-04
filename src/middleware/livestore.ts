/**
 * LiveStore Middleware
 * 
 * This middleware intercepts Redux actions and syncs certain operations to LiveStore.
 * It bridges the gap between Redux (legacy) and LiveStore (new).
 * 
 * As migration progresses, more actions will be handled here.
 */

import { Middleware } from 'redux'
import { getLiveStoreInstance } from '../stores/livestore/accessor'
import { addMediaAction } from '../stores/livestore/actions'
import { NormalizedMedia } from '../utils/normalizeMedia'
import * as types from '../constants/ActionTypes'

export const livestoreMiddleware: Middleware = (store) => (next) => async (action: unknown) => {
  const typedAction = action as { type: string; media?: NormalizedMedia }
  // Pass action through first
  const result = next(action)

  // Then handle LiveStore sync
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    return result
  }

  try {
    switch (typedAction.type) {
      case types.ADD_MEDIA_TO_LIVESTORE: {
        await addMediaAction(liveStore, typedAction.media as NormalizedMedia)
        
        // Dispatch success action
        store.dispatch({
          type: types.MEDIA_ADDED_TO_LIVESTORE,
          media: typedAction.media
        })
        break
      }
      
      // RECEIVE_COLLECTION removed - saga now handles LiveStore insert directly
      // This prevents the cascade of reactive queries during bulk insert
      
      // Add more cases as we migrate more actions
      default:
        break
    }
  } catch (error) {
    console.error('LiveStore middleware error:', error)
    store.dispatch({
      type: types.SEND_NOTIFICATION,
      notification: 'Failed to sync to LiveStore',
      level: 'error'
    })
  }
  
  return result
}
