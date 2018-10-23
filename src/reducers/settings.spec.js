// @flow

import reducer from './settings'

import { RECEIVE_SETTINGS } from '../constants/ActionTypes'
import { defaultState } from './settings'

describe('settings reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle RECEIVE_SETTINGS', () => {
    const settings = {
      mstream: {
        baseUrl: 'http://localhost'
      }
    }
    expect(reducer(undefined, {type: RECEIVE_SETTINGS, settings}))
      .toEqual(
        {
          error: '',
          saving: false,
          settings
        }
      )
  })
})
