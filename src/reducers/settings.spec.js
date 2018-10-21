// @flow

import reducer from './settings'

import { RECEIVE_SETTINGS } from '../constants/ActionTypes'

describe('settings reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {
          error: '',
          saving: false,
          settings: {}
        }
      )
  })

  it('should handle RECEIVE_SETTINGS', () => {
    const settings = {
      mstream: {
        baseUrl: 'http://localhost'
      }
    }
    expect(reducer(undefined, {action: RECEIVE_SETTINGS, settings}))
      .toEqual(
        {
          error: '',
          saving: false,
          settings
        }
      )
  })
})
