// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  SAVE_SETTINGS,
  SETTINGS_SAVED_SUCCESSFULLY,
  RECEIVE_SETTINGS,
  INITIALIZE_SETTINGS
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

  it('should handle INITIALIZE_SETTINGS event', () => {

    const settingsPayload = {
      providers: {
        dummy: {
          enabled: true
        }
      }
    }

    return expectSaga(settingsSaga)
      .dispatch({type: INITIALIZE_SETTINGS, settingsPayload})
      .put({type: RECEIVE_SETTINGS, settings: {}})
      .run()
  })
})
