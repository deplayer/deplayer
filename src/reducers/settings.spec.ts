import reducer, { defaultState } from './settings'
import { describe, it, expect } from 'vitest'

import * as types from '../constants/ActionTypes'

describe('settings reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle RECEIVE_SETTINGS', () => {
    const settings = {
      providers: {
        subsonic0: {
          enabled: true,
          baseUrl: 'http://localhost'
        }
      },
      app: defaultState.settings.app
    }

    const result = reducer(undefined, { type: types.RECEIVE_SETTINGS, settings })
    
    expect(result.settings).toEqual(settings)
    expect(result.settingsForm.providers.subsonic0).toBeDefined()
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
    expect(reducer(undefined, { type: types.SETTINGS_SAVED_SUCCESSFULLY, settings }))
      .toEqual(expect.objectContaining({ settings }))
  })

  it('should handle ADD_PROVIDER', () => {
    const result = reducer(undefined, {
      type: types.ADD_PROVIDER,
      providerKey: 'subsonic'
    })

    expect(result.settingsForm).toBeDefined()
    expect(result.settingsForm.providers.subsonic0).toBeDefined()
    expect(result.settings.providers.subsonic0).toEqual({
      enabled: false
    })
  })

  it('should handle REMOVE_PROVIDER', () => {
    const initialState = {
      settings: {
        app: {
          spectrum: {
            enabled: false
          },
          lastfm: {
            enabled: false,
            apikey: ''
          }
        },
        providers: {
          subsonic: {
            something: 'test',
            enabled: true
          }
        }
      },
      settingsForm: {
        providers: {
          subsonic: {
            fields: [{
              title: 'Test Field',
              type: 'text'
            }]
          }
        },
        fields: {}
      },
      error: '',
      saving: false
    }
    const result = reducer(initialState, {
      type: types.REMOVE_PROVIDER,
      providerKey: 'subsonic'
    })

    expect(result.settingsForm).toBeDefined()
    expect(result.settingsForm.providers['subsonic']).not.toBeDefined()
  })

  it('should handle adding multiple instances of the same provider', () => {
    let state = { ...defaultState }

    // Add first subsonic provider
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })
    expect(state.settings.providers.subsonic0).toBeDefined()
    expect(state.settingsForm.providers.subsonic0).toBeDefined()

    // Add second subsonic provider
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })
    expect(state.settings.providers.subsonic1).toBeDefined()
    expect(state.settingsForm.providers.subsonic1).toBeDefined()

    // Verify both providers exist with correct settings
    expect(Object.keys(state.settings.providers)).toContain('subsonic0')
    expect(Object.keys(state.settings.providers)).toContain('subsonic1')
    expect(state.settings.providers.subsonic0).toEqual({ enabled: false })
    expect(state.settings.providers.subsonic1).toEqual({ enabled: false })
  })

  it('should handle removing a specific provider instance', () => {
    // Setup initial state with two subsonic providers
    let state = { ...defaultState }
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })

    // Configure the providers
    const settings = {
      ...state.settings,
      providers: {
        ...state.settings.providers,
        subsonic0: { enabled: true, baseUrl: 'http://first.local' },
        subsonic1: { enabled: true, baseUrl: 'http://second.local' }
      }
    }
    state = reducer(state, { type: types.SETTINGS_SAVED_SUCCESSFULLY, settings })

    // Remove first subsonic provider
    state = reducer(state, { type: types.REMOVE_PROVIDER, providerKey: 'subsonic0' })

    // Verify subsonic0 is removed but subsonic1 remains with its settings
    expect(state.settings.providers.subsonic0).toBeUndefined()
    expect(state.settings.providers.subsonic1).toEqual({
      enabled: true,
      baseUrl: 'http://second.local'
    })
    expect(state.settingsForm.providers.subsonic0).toBeUndefined()
    expect(state.settingsForm.providers.subsonic1).toBeDefined()
  })

  it('should preserve provider settings when saving', () => {
    let state = { ...defaultState }

    // Add and configure a provider
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })
    
    const settings = {
      ...state.settings,
      providers: {
        subsonic0: {
          enabled: true,
          baseUrl: 'http://localhost',
          user: 'test',
          password: 'test'
        }
      }
    }

    state = reducer(state, { type: types.SETTINGS_SAVED_SUCCESSFULLY, settings })

    // Add another provider
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })

    // Verify first provider settings are preserved
    expect(state.settings.providers.subsonic0).toEqual({
      enabled: true,
      baseUrl: 'http://localhost',
      user: 'test',
      password: 'test'
    })
    expect(state.settings.providers.subsonic1).toEqual({
      enabled: false
    })
  })

  it('should handle non-repeatable providers', () => {
    let state = { ...defaultState }

    // Add musicbrainz provider (non-repeatable)
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'musicbrainz' })

    // Verify only one instance exists with default settings
    expect(state.settings.providers.musicbrainz).toBeDefined()
    expect(state.settings.providers.musicbrainz).toEqual({
      enabled: false
    })
    expect(state.settings.providers.musicbrainz0).toBeUndefined()
  })

  it('should handle adding fields to the settings form', () => {
    let state = { ...defaultState }

    // Add subsonic provider
    state = reducer(state, { type: types.ADD_PROVIDER, providerKey: 'subsonic' })
    expect(state.settingsForm.providers.subsonic0).toBeDefined()

    // Add fields to the subsonic provider
    const settings = {
      ...state.settings,
      providers: {
        subsonic0: {
          enabled: true,
          baseUrl: 'http://localhost',
          user: 'test',
          password: 'test',
          fields: [{
            title: 'Test Field',
            type: 'text'
          }]
        }
      }
    }

    state = reducer(state, { type: types.SETTINGS_SAVED_SUCCESSFULLY, settings })

    // Verify fields are added to the provider
    expect(state.settings.providers.subsonic0).toEqual({
      enabled: true,
      baseUrl: 'http://localhost',
      user: 'test',
      password: 'test',
      fields: [{
        title: 'Test Field',
        type: 'text'
      }]
    })
  })
})
