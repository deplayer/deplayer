import { describe, it, expect } from 'vitest'
import { put, call, select } from 'redux-saga/effects'
import settingsSaga, { saveSettings } from './index'
import * as types from '../../constants/ActionTypes'
import { getSettings } from '../selectors'
import SettingsService from '../../services/settings/SettingsService'
import { getAdapter } from '../../services/database'
import { storeSyncSettings } from '../../services/settings/syncSettings'
import { reconnect } from '../../services/database/PgliteDatabase'

describe('settings saga', () => {
  describe('saveSettings', () => {
    it('should handle saving settings with missing app section', () => {
      const adapter = getAdapter()
      const settingsService = new SettingsService(adapter)
      const gen = saveSettings({
        type: types.SAVE_SETTINGS,
        settingsPayload: {
          providers: {
            subsonic0: {
              enabled: true,
              baseUrl: 'http://localhost'
            }
          }
        }
      })

      // First get the previous settings
      const selectEffect = gen.next().value
      expect(selectEffect).toEqual(select(getSettings))

      // Mock the previous settings response
      const prevSettings = {
        app: {
          spectrum: {
            enabled: false
          },
          lastfm: {
            enabled: false,
            apikey: ''
          }
        },
        providers: {}
      }

      // Save settings should merge with previous settings
      const settingsToSave = {
        ...prevSettings,
        providers: {
          subsonic0: {
            enabled: true,
            baseUrl: 'http://localhost'
          }
        },
        app: prevSettings.app
      }

      const saveEffect = gen.next(prevSettings).value
      expect(saveEffect.type).toBe('CALL')
      expect(saveEffect.payload.args).toEqual([
        'settings',
        settingsToSave
      ])

      // Mock successful save
      const savedSettings = settingsToSave

      // Should dispatch success action
      const successEffect = gen.next(savedSettings).value
      expect(successEffect).toEqual(
        put({ type: types.SETTINGS_SAVED_SUCCESSFULLY, settings: savedSettings })
      )

      // Should trigger initialize
      const initEffect = gen.next().value
      expect(initEffect).toEqual(
        put({ type: types.INITIALIZE, settings: savedSettings })
      )

      // Should show success notification
      const notifyEffect = gen.next().value
      expect(notifyEffect).toEqual(
        put({
          type: types.SEND_NOTIFICATION,
          notification: "notifications.settings.saved",
        })
      )

      // Saga should be done
      expect(gen.next().done).toBe(true)
    })

    it('should handle saving settings with sync changes', () => {
      const adapter = getAdapter()
      const settingsService = new SettingsService(adapter)
      const gen = saveSettings({
        type: types.SAVE_SETTINGS,
        settingsPayload: {
          app: {
            sync: {
              enabled: true,
              serverUrl: 'http://new-server'
            }
          }
        }
      })

      // First get the previous settings
      const selectEffect = gen.next().value
      expect(selectEffect).toEqual(select(getSettings))

      // Mock the previous settings response with different sync settings
      const prevSettings = {
        app: {
          sync: {
            enabled: false,
            serverUrl: 'http://old-server'
          }
        },
        providers: {}
      }

      // Save settings should merge with previous settings
      const settingsToSave = {
        ...prevSettings,
        app: {
          ...prevSettings.app,
          sync: {
            enabled: true,
            serverUrl: 'http://new-server'
          }
        }
      }

      const saveEffect = gen.next(prevSettings).value
      expect(saveEffect.type).toBe('CALL')
      expect(saveEffect.payload.args).toEqual([
        'settings',
        settingsToSave
      ])

      // Mock successful save
      const savedSettings = settingsToSave

      // Should dispatch success action
      const successEffect = gen.next(savedSettings).value
      expect(successEffect).toEqual(
        put({ type: types.SETTINGS_SAVED_SUCCESSFULLY, settings: savedSettings })
      )

      // Should trigger initialize
      const initEffect = gen.next().value
      expect(initEffect).toEqual(
        put({ type: types.INITIALIZE, settings: savedSettings })
      )

      // Should show success notification
      const notifyEffect = gen.next().value
      expect(notifyEffect).toEqual(
        put({
          type: types.SEND_NOTIFICATION,
          notification: "notifications.settings.saved",
        })
      )

      // Should trigger reconnect due to sync changes
      const reconnectEffect = gen.next().value
      expect(reconnectEffect).toEqual(call(reconnect))

      // Saga should be done
      expect(gen.next().done).toBe(true)
    })

    it('should handle errors when saving settings', () => {
      const adapter = getAdapter()
      const settingsService = new SettingsService(adapter)
      const gen = saveSettings({
        type: types.SAVE_SETTINGS,
        settingsPayload: {}
      })

      // First get the previous settings
      const selectEffect = gen.next().value
      expect(selectEffect).toEqual(select(getSettings))

      // Mock error from settings service
      const error = new Error('Failed to save settings')
      const errorEffect = gen.throw(error).value
      expect(errorEffect).toEqual(
        put({ 
          type: types.SETTINGS_SAVED_REJECTED, 
          error: error.message 
        })
      )

      // Should show error notification
      const notifyEffect = gen.next().value
      expect(notifyEffect).toEqual(
        put({
          type: types.SEND_NOTIFICATION,
          notification: "notifications.settings.error_saving",
          error: error.message,
        })
      )

      // Saga should be done
      expect(gen.next().done).toBe(true)
    })
  })
}) 
