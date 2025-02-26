import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'react-toastify'
import { Field } from 'formik'
import DatabaseSyncForm from './DatabaseSyncForm'
import { storeSyncSettings } from '../../services/settings/syncSettings'
import { reconnect } from '../../services/database/PgliteDatabase'

// Mock only the toast functions we use
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock only the settings functions we use
vi.mock('../../services/settings/syncSettings', () => ({
  storeSyncSettings: vi.fn(),
  getSyncFormSchema: vi.fn(() => ({
    fields: [
      { name: "enabled", type: "checkbox", value: false },
      { name: "serverUrl", type: "url", value: "http://localhost:3000" }
    ],
  }))
}))

vi.mock('../../services/database/PgliteDatabase', () => ({
  reconnect: vi.fn()
}))

// Simplified FormSchema mock that just renders the fields we need to test
vi.mock('./FormSchema', () => ({
  default: () => (
    <>
      <Field type="checkbox" name="enabled" />
      <Field type="text" name="serverUrl" />
    </>
  )
}))

describe('DatabaseSyncForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default values', () => {
    render(<DatabaseSyncForm />)
    
    // Check if form fields are rendered
    expect(screen.getByRole('checkbox')).toBeTruthy()
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('handles form submission successfully', async () => {
    render(<DatabaseSyncForm />)
    
    // Get form elements
    const enabledCheckbox = screen.getByRole('checkbox')
    const serverUrlInput = screen.getByRole('textbox')

    // Change form values
    fireEvent.click(enabledCheckbox)
    fireEvent.change(serverUrlInput, { target: { value: 'http://test-server:3000' } })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(storeSyncSettings).toHaveBeenCalledWith({
        enabled: true,
        serverUrl: 'http://test-server:3000'
      })
      expect(reconnect).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Sync settings saved')
    })
  })

  it('handles form submission error', async () => {
    const error = new Error('Test error')
    vi.mocked(reconnect).mockRejectedValueOnce(error)

    render(<DatabaseSyncForm />)
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error saving sync settings')
    })
  })
}) 