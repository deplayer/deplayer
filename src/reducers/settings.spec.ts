import reducer from './settings'

import * as types from '../constants/ActionTypes'

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
    expect(reducer(undefined, {type: types.RECEIVE_SETTINGS, settings}))
      .toEqual(
        {
          ...defaultState,
          error: '',
          saving: false,
          settings
        }
      )
  })

  it('should handle SETTINGS_SAVED_SUCCESSFULLY', () => {
    const settings = {
      providers: {
        itunes: {
          enabled: false
        },
        mstream: {
          enabled: true,
          baseUrl: ''
        },
        subsonic: {
          enabled: false,
          baseUrl: '',
          user: '',
          password: ''
        }
      }
    }
    expect(reducer(undefined, {type: types.SETTINGS_SAVED_SUCCESSFULLY, settings}))
      .toEqual(
        {
          ...defaultState,
          error: '',
          saving: false,
          settings
        }
      )
  })

  it('should handle ADD_PROVIDER', () => {
    expect(reducer(undefined, {type: types.ADD_PROVIDER}))
      .toEqual(
        {
          ...defaultState
        }
      )
  })
})
