import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import type { ButtonHTMLAttributes } from 'react'
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
  I18n: { t: (key: string) => key },
  Translate: () => null
}))

vi.mock('../common/Icon', () => ({
  default: () => null
}))

vi.mock('../common/Button', () => ({
  default: (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />
}))

const mockStore = configureStore([])
let store: ReturnType<typeof mockStore>

const renderComponent = (pathname: string, mediaIds?: string[]) => {
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
        <PlayAllButton mediaIds={mediaIds} />
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

  it('dispatches PLAY_LIST with the provided mediaIds when clicked', () => {
    renderComponent('/', ['song-1', 'song-2'])

    const button = screen.getByRole('button', { name: 'buttons.playAll' })
    fireEvent.click(button)

    expect(store.getActions()).toContainEqual({
      type: 'PLAY_LIST',
      trackIds: ['song-1', 'song-2']
    })
  })

  it('does not dispatch when no mediaIds are provided', () => {
    renderComponent('/')

    const button = screen.getByRole('button', { name: 'buttons.playAll' })
    fireEvent.click(button)

    expect(store.getActions()).toHaveLength(0)
  })

  it('should not render on settings page', () => {
    renderComponent('/settings', ['song-1'])

    const button = screen.queryByRole('button', { name: 'buttons.playAll' })
    expect(button).not.toBeInTheDocument()
  })
})
