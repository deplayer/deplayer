import { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { defaultState as collectionDefaultState, State as CollectionState } from '../reducers/collection'
import { defaultState as queueDefaultState, State as QueueState } from '../reducers/queue'
import { defaultState as playerDefaultState, State as PlayerState } from '../reducers/player'
import { defaultState as lyricsDefaultState, State as LyricsState } from '../reducers/lyrics'
import { defaultState as settingsDefaultState, State as SettingsState } from '../reducers/settings'

export interface TestState {
  collection?: CollectionState
  queue?: QueueState
  player?: PlayerState
  lyrics?: LyricsState
  settings?: SettingsState
  favorites?: {
    favoriteIds: Set<string>
  }
  i18n?: {
    locale: string
  }
  translations?: Record<string, any>
}

export const defaultTestState: TestState = {
  collection: collectionDefaultState,
  queue: queueDefaultState,
  player: playerDefaultState,
  lyrics: lyricsDefaultState,
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
      queue: (state = mergedState.queue) => state,
      player: (state = mergedState.player) => state,
      lyrics: (state = mergedState.lyrics) => state,
      favorites: (state = mergedState.favorites) => state,
      i18n: (state = mergedState.i18n) => state,
      translations: (state = mergedState.translations) => state,
      settings: (state = mergedState.settings) => state
    }
  })
}

interface TestWrapperProps {
  children: ReactNode
  initialState?: Partial<TestState>
}

const TestWrapper = ({ children, initialState = {} }: TestWrapperProps) => {
  const store = createTestStore(initialState)

  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialState = {} }: { initialState?: Partial<TestState> } = {}
) => {
  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestWrapper initialState={initialState}>
          {children}
        </TestWrapper>
      )
    })
  }
} 