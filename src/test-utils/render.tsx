import { render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { State as RootState } from '../reducers'
import { createTestStore } from './store'
import userEvent from '@testing-library/user-event'
import { UIProvider } from '../contexts/UIContext'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { schema } from '../stores/livestore/schema'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

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
  const liveStoreAdapter = makeInMemoryAdapter()
  const testStoreId = `test-${Date.now()}`
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <LiveStoreProvider 
        adapter={liveStoreAdapter}
        schema={schema}
        storeId={testStoreId}
        batchUpdates={batchUpdates}
      >
        <Provider store={store}>
          <UIProvider initialState={{ loading: false, ready: true }}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </UIProvider>
        </Provider>
      </LiveStoreProvider>
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