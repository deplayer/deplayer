// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  SAVE_SETTINGS,
  SETTINGS_SAVED_SUCCESSFULLY,
  RECEIVE_SETTINGS,
  INITIALIZED
} from '../constants/ActionTypes'

import settingsSaga from './settings'

describe('settings saga', () => {
  it('should handle settings events', () => {

    const settingsPayload = {}

    return expectSaga(settingsSaga)
      .dispatch({type: SAVE_SETTINGS, settingsPayload})
      .put({type: SETTINGS_SAVED_SUCCESSFULLY})
      .run()
  })

  it('should handle INITIALIZED event', () => {

    const settingsPayload = {
      providers: {
        dummy: {
          enabled: true
        }
      }
    }

    return expectSaga(settingsSaga)
      .dispatch({type: INITIALIZED, settingsPayload})
      .put({type: RECEIVE_SETTINGS, settings: {}})
      .run()
  })
})
