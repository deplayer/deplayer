/**
 * LiveStore Middleware
 * 
 * This middleware intercepts Redux actions and syncs certain operations to LiveStore.
 * It bridges the gap between Redux (legacy) and LiveStore (new).
 * 
 * As migration progresses, more actions will be handled here.
 */

import { Middleware } from 'redux'
import { Store as LiveStore } from '@livestore/livestore'
import { addMediaAction, addMediaBulkAction } from '../stores/livestore/actions'
import * as types from '../constants/ActionTypes'

let liveStoreInstance: LiveStore | null = null

// Call this after LiveStore is initialized
export const setLiveStoreInstance = (store: LiveStore) => {
  liveStoreInstance = store
}

// Get the LiveStore instance
export const getLiveStoreInstance = (): LiveStore | null => {
  return liveStoreInstance
}

export const livestoreMiddleware: Middleware = (store) => (next) => async (action: any) => {
  // Pass action through first
  const result = next(action)
  
  // Then handle LiveStore sync
  if (!liveStoreInstance) {
    return result
  }
  
  try {
    switch (action.type) {
      case types.ADD_MEDIA_TO_LIVESTORE: {
        await addMediaAction(liveStoreInstance, action.media)
        
        // Dispatch success action
        store.dispatch({
          type: types.MEDIA_ADDED_TO_LIVESTORE,
          media: action.media
        })
        break
      }
      
      case types.RECEIVE_COLLECTION: {
        // When providers fetch media, it dispatches RECEIVE_COLLECTION
        // We need to add all that media to LiveStore
        if (action.data && Array.isArray(action.data) && action.data.length > 0) {
          console.log('[LiveStore] Syncing', action.data.length, 'media items to LiveStore')
          console.log('[LiveStore] Sample media item:', action.data[0])
          
          try {
            await addMediaBulkAction(liveStoreInstance, action.data)
            console.log('[LiveStore] ✅ Successfully synced', action.data.length, 'media items')
          } catch (error) {
            console.error('[LiveStore] ❌ Failed to sync media:', error)
            console.error('[LiveStore] Sample item that failed:', action.data[0])
            throw error
          }
        } else {
          console.log('[LiveStore] RECEIVE_COLLECTION with no data or empty array')
        }
        break
      }
      
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
