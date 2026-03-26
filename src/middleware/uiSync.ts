import { Middleware } from 'redux'
import { useUIStore } from '../stores/uiStore'
import * as types from '../constants/ActionTypes'

/**
 * Redux middleware that syncs app-related actions to the Zustand UI store.
 * Transitional bridge — once sagas call Zustand directly, remove this.
 */
export const uiSyncMiddleware: Middleware = () => (next) => (action: any) => {
  const result = next(action)
  const store = useUIStore.getState()

  switch (action.type) {
    case types.SET_MQL:
      store.setMqlMatch(action.value)
      break
    case types.SET_HEIGHT_MQL:
      store.setHeightMqlMatch(action.value)
      break
    case types.INITIALIZED:
      store.setLoading(false)
      break
    case types.TOGGLE_SIDEBAR:
      store.toggleSidebar(action.value)
      break
    case types.TOGGLE_RIGHT_PANEL:
      store.toggleRightPanel(action.value)
      break
    case types.TOGGLE_SPECTRUM:
      store.toggleSpectrum()
      break
    case types.TOGGLE_VISUALS:
      store.toggleVisuals()
      break
    case types.SHOW_ADD_MEDIA_MODAL:
      store.setShowAddMediaModal(true)
      break
    case types.HIDE_ADD_MEDIA_MODAL:
      store.setShowAddMediaModal(false)
      break
    case types.TOGGLE_MINI_QUEUE:
      store.toggleMiniQueue()
      break
    case types.SET_BACKGROUND_IMAGE:
      store.setBackgroundImage(action.backgroundImage)
      break
    case types.APP_READY:
      store.setReady(true)
      break
  }

  return result
}
