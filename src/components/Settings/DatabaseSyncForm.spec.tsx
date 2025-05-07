import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import DatabaseSyncForm from './DatabaseSyncForm'

const mockStore = configureStore([])

// Mock the store with translations
const store = mockStore({
  i18n: {
    translations: {
      labels: {
        enableSync: 'Enable Sync',
        syncServerUrl: 'Server URL',
        syncDescription: 'Sync Description',
        syncServerInstructions: 'Server Instructions',
        readDocs: 'Read Docs'
      }
    }
  }
})

// Mock getSyncFormSchema
vi.mock('../../services/settings/syncSettings', () => ({
  getSyncFormSchema: vi.fn(() => ({
    fields: [
      { name: "enabled", type: "checkbox", value: false },
      { name: "serverUrl", type: "url", value: "http://localhost:3000" }
    ]
  }))
}))

describe('DatabaseSyncForm', () => {
  const defaultProps = {
    values: {
      app: {
        sync: {
          enabled: false,
          serverUrl: 'http://localhost:3000'
        }
      }
    },
    setFieldValue: vi.fn()
  }

  it('renders with default values', () => {
    render(
      <Provider store={store}>
        <DatabaseSyncForm {...defaultProps} />
      </Provider>
    )
    
    // Check if form fields are rendered
    const enabledCheckbox = screen.getByRole('checkbox')
    const serverUrlInput = screen.getByRole('textbox')

    expect(enabledCheckbox).toBeTruthy()
    expect(serverUrlInput).toBeTruthy()
    expect(enabledCheckbox).not.toBeChecked()
    expect(serverUrlInput).toHaveValue('http://localhost:3000')
  })

  it('handles form field changes', async () => {
    render(
      <Provider store={store}>
        <DatabaseSyncForm {...defaultProps} />
      </Provider>
    )
    
    // Get form elements
    const enabledCheckbox = screen.getByRole('checkbox')
    const serverUrlInput = screen.getByRole('textbox')

    // Change form values
    fireEvent.click(enabledCheckbox)
    expect(defaultProps.setFieldValue).toHaveBeenCalledWith('app.sync', {
      enabled: true,
      serverUrl: 'http://localhost:3000'
    })

    fireEvent.change(serverUrlInput, { target: { value: 'http://test-server:3000' } })
    expect(defaultProps.setFieldValue).toHaveBeenCalledWith('app.sync', {
      enabled: false,
      serverUrl: 'http://test-server:3000'
    })
  })

  it('renders sync instructions', () => {
    render(
      <Provider store={store}>
        <DatabaseSyncForm {...defaultProps} />
      </Provider>
    )

    expect(screen.getByText('syncDescription')).toBeTruthy()
    expect(screen.getByText('syncServerInstructions')).toBeTruthy()
    expect(screen.getByText('readDocs')).toBeTruthy()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://gitlab.com/deplayer/deplayer/-/blob/master/README.md#sync-server-setup'
    )
  })
}) 