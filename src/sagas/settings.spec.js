// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  SETTINGS_SAVE,
  SETTINGS_SAVED_SUCCESSFULLY
} from '../constants/ActionTypes'

import settingsSaga from './settings'

describe('settings saga', () => {
  it('should handle settings events', () => {

    const settingsPayload = {}

    return expectSaga(settingsSaga)
      .dispatch({type: SETTINGS_SAVE, settingsPayload})
      .put({type: SETTINGS_SAVED_SUCCESSFULLY})
      .run()
  })
})
