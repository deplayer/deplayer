import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import PlayAllButton from './PlayAllButton'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: vi.fn()
  }
})

vi.mock('react-redux-i18n', () => ({
  Translate: () => null
}))

vi.mock('../common/Icon', () => ({
  default: () => null
}))

vi.mock('../common/Button', () => ({
  default: ({ children, onClick }: any) => (
    <button data-testid="play-all-button" onClick={onClick}>{children}</button>
  )
}))

vi.mock('../../stores/livestore/store', () => ({
 useAppStore: () => ({ commit: vi.fn() }),
}))

vi.mock('../../stores/livestore/actions', () => ({
  playAllAction: vi.fn(),
}))

vi.mock('../../stores/livestore/hooks', () => ({
  useQueue: vi.fn(() => ({ trackIds: [], currentPlaying: null })),
}))

const mockStore = configureStore<any, any>([])
let store: ReturnType<typeof mockStore>

const renderComponent = (pathname: string) => {
  cleanup()
  store = mockStore({
    i18n: {
      translations: {
        buttons: {
          playAll: 'Play this list'
        }
      },
      locale: 'en'
    }
  })

  vi.mocked(useLocation).mockReturnValue({ pathname, search: '', hash: '', state: null, key: 'default' })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <PlayAllButton dispatch={store.dispatch} />
      </MemoryRouter>
    </Provider>
  )
}

describe('PlayAllButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should dispatch PLAY_ALL action with collection path when on root path', () => {
    renderComponent('/')
    
    const button = screen.getByTestId('play-all-button')
    fireEvent.click(button)
    
    expect(store.getActions()).toContainEqual({
      type: 'PLAY_ALL',
      path: 'collection'
    })
  })

  it('should dispatch PLAY_ALL action with correct path when clicked', () => {
    renderComponent('/albums/123')
    
    const button = screen.getByTestId('play-all-button')
    fireEvent.click(button)
    
    expect(store.getActions()).toContainEqual({
      type: 'PLAY_ALL',
      path: 'albums/123'
    })
  })

  it('should not render on settings page', () => {
    renderComponent('/settings')
    
    const button = screen.queryByTestId('play-all-button')
    expect(button).not.toBeInTheDocument()
  })
}) 