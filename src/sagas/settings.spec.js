// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  SETTINGS_SAVE,
  SETTINGS_SAVED_SUSCCESSFULLY
} from '../constants/ActionTypes'

import { settings } from './settings'

describe('settings saga', () => {
  it('should handle settings events', () => {

    const settingsPayload = {}

    return expectSaga(settings, {type: SETTINGS_SAVE, settingsPayload})
      .put({type: SETTINGS_SAVED_SUSCCESSFULLY})
      .run()
  })
})
