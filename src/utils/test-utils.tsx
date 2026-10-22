import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { defaultState as collectionDefaultState, State as CollectionState } from '../reducers/collection'
import { defaultState as playerDefaultState, State as PlayerState } from '../reducers/player'
import { defaultState as settingsDefaultState, State as SettingsState } from '../reducers/settings'

export interface TestState {
  collection?: CollectionState
  player?: PlayerState
  settings?: SettingsState
  favorites?: {
    favoriteIds: Set<string>
  }
  i18n?: {
    locale: string
  }
  translations?: Record<string, unknown>
}

export const defaultTestState: TestState = {
  collection: collectionDefaultState,
  player: playerDefaultState,
  settings: settingsDefaultState,
  favorites: { favoriteIds: new Set() },
  i18n: { locale: 'en' },
  translations: {}
}

const createTestStore = (initialState: Partial<TestState> = {}) => {
  const mergedState = {
    ...defaultTestState,
    ...initialState
  }

  return configureStore({
    reducer: {
      collection: (state = mergedState.collection) => state,
      player: (state = mergedState.player) => state,
      favorites: (state = mergedState.favorites) => state,
      i18n: (state = mergedState.i18n) => state,
      translations: (state = mergedState.translations) => state,
      settings: (state = mergedState.settings) => state
    }
  })
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialState = {} }: { initialState?: Partial<TestState> } = {}
) => {
  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <Provider store={createTestStore(initialState)}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </Provider>
      )
    })
  }
} 