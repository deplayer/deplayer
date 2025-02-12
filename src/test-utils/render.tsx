import { render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { State as RootState } from '../reducers'
import { createTestStore } from './store'
import userEvent from '@testing-library/user-event'

interface RenderOptions {
  initialState?: Partial<RootState>
  route?: string
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    route = '/',
    ...renderOptions
  }: RenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route)
  
  const store = createTestStore(initialState)
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    )
  }

  return {
    store,
    user: userEvent.setup(),
    ...rtlRender(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    })
  }
}

// Re-export everything
export * from '@testing-library/react' 