import { render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { State as RootState } from '../reducers'
import { createTestStore } from './store'
import userEvent from '@testing-library/user-event'
import { useUIStore } from '../stores/uiStore'
import { StoreRegistry, StoreRegistryProvider } from '@livestore/react'
import { Suspense } from 'react'

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
  
  // Set Zustand UI store to test-friendly defaults
  useUIStore.setState({ loading: false, ready: true })
  
  const store = createTestStore(initialState)
  const storeRegistry = new StoreRegistry()
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <StoreRegistryProvider storeRegistry={storeRegistry}>
        <Suspense fallback={null}>
          <Provider store={store}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </Provider>
        </Suspense>
      </StoreRegistryProvider>
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