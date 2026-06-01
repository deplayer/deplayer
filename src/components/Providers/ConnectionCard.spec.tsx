import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConnectionCard } from './ConnectionCard'
import providerRegistry from '../../services/settings/providers'
import type { HealthCheckResult } from '../../types/providers'

beforeAll(() => {
  const root = document.createElement('div')
  root.id = 'modal-root'
  document.body.appendChild(root)
})

const subsonicSchema = providerRegistry.subsonic
const itunesSchema = providerRegistry.itunes

const baseConfig = {
  enabled: true,
  baseUrl: 'https://nav.example.com',
  user: 'genar',
  password: 'hunter2',
}

const healthOk: HealthCheckResult = { status: 'connected', checkedAt: 1, latencyMs: 12 }
const healthAuth: HealthCheckResult = { status: 'authFailed', error: 'wrong password', checkedAt: 1 }

const defaultProps = {
  instanceKey: 'subsonic',
  providerKey: 'subsonic',
  schema: subsonicSchema,
  config: baseConfig,
  health: healthOk,
  onSave: vi.fn(),
  onRemove: vi.fn(),
  onToggleEnabled: vi.fn(),
  onTestConnection: vi.fn(),
}

describe('ConnectionCard — visual shell', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('starts collapsed when health is connected', () => {
    render(<ConnectionCard {...defaultProps} />)
    expect(screen.queryByLabelText(/baseUrl/i)).not.toBeInTheDocument()
  })

  it('renders hostname as title when no name is set', () => {
    render(<ConnectionCard {...defaultProps} />)
    expect(screen.getByTestId('card-title-subsonic')).toHaveTextContent('nav.example.com')
  })

  it('renders user-supplied name as title when present', () => {
    render(<ConnectionCard {...defaultProps} config={{ ...baseConfig, name: 'Home Navidrome' }} />)
    expect(screen.getByText('Home Navidrome')).toBeInTheDocument()
  })

  it('renders capability chips', () => {
    render(<ConnectionCard {...defaultProps} />)
    const card = screen.getByTestId('connection-card-subsonic')
    expect(within(card).getByText(/sync/i)).toBeInTheDocument()
    expect(within(card).getByText(/search/i)).toBeInTheDocument()
    expect(within(card).getByText(/stream/i)).toBeInTheDocument()
  })

  it('auto-expands when health is authFailed and shows the error inline', () => {
    render(<ConnectionCard {...defaultProps} health={healthAuth} />)
    expect(screen.getByText(/^baseUrl$/i)).toBeInTheDocument()
    expect(screen.getByText(/wrong password/i)).toBeInTheDocument()
  })

  it('auto-expands when a required field is empty', () => {
    render(
      <ConnectionCard
        {...defaultProps}
        config={{ enabled: true, baseUrl: '', user: '', password: '' }}
      />,
    )
    expect(screen.getByText(/^baseUrl$/i)).toBeInTheDocument()
  })
  it('expands when the header row is clicked', async () => {
    const user = userEvent.setup()
    render(<ConnectionCard {...defaultProps} />)
    await user.click(screen.getByTestId('card-title-subsonic'))
    expect(screen.getByText(/^baseUrl$/i)).toBeInTheDocument()
  })

  it('renders the disabled status dot when config.enabled is false', () => {
    render(<ConnectionCard {...defaultProps} config={{ ...baseConfig, enabled: false }} />)
    expect(screen.getByLabelText(/Disabled/i)).toBeInTheDocument()
  })
})

describe('ConnectionCard — form behavior', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderExpanded = (overrides: Partial<typeof defaultProps> = {}) =>
    render(<ConnectionCard {...defaultProps} health={healthAuth} {...overrides} />)

  it('hides Save/Cancel until the form is dirty', async () => {
    renderExpanded()
    expect(screen.queryByRole('button', { name: /saveSettings|save/i })).not.toBeInTheDocument()
  })

  it('shows Save and Cancel after a field is edited', async () => {
    const user = userEvent.setup()
    renderExpanded()
    const labelInput = screen.getAllByPlaceholderText(/nav\.example\.com/i)[0]
    await user.type(labelInput, 'Home')
    expect(screen.getByRole('button', { name: /saveSettings|save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onSave with the merged slice when Save is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderExpanded({ onSave })
    const labelInput = screen.getAllByPlaceholderText(/nav\.example\.com/i)[0]
    await user.type(labelInput, 'Home')
    await user.click(screen.getByRole('button', { name: /saveSettings|save/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('subsonic', expect.objectContaining({ name: 'Home', baseUrl: 'https://nav.example.com' }))
  })

  it('Cancel reverts dirty edits and hides the footer', async () => {
    const user = userEvent.setup()
    renderExpanded()
    const labelInput = screen.getAllByPlaceholderText(/nav\.example\.com/i)[0] as HTMLInputElement
    await user.type(labelInput, 'Home')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(labelInput.value).toBe('')
    expect(screen.queryByRole('button', { name: /saveSettings|save/i })).not.toBeInTheDocument()
  })

  it('disables Save when a required field is empty', async () => {
    const user = userEvent.setup()
    render(
      <ConnectionCard
        {...defaultProps}
        health={{ status: 'unreachable', checkedAt: 0 }}
        config={{ enabled: true, baseUrl: '', user: '', password: '' }}
      />,
    )
    const labelInput = screen.getAllByPlaceholderText(/Subsonic|subsonic/i)[0]
    await user.type(labelInput, 'Home')
    expect(screen.getByRole('button', { name: /saveSettings|save/i })).toBeDisabled()
  })

  it('toggling enabled fires onToggleEnabled immediately (autosave)', async () => {
    const onToggleEnabled = vi.fn()
    const user = userEvent.setup()
    render(<ConnectionCard {...defaultProps} onToggleEnabled={onToggleEnabled} />)
    await user.click(screen.getByRole('switch'))
    expect(onToggleEnabled).toHaveBeenCalledWith('subsonic', false)
  })

  it('Test connection button calls onTestConnection', async () => {
    const onTestConnection = vi.fn()
    const user = userEvent.setup()
    renderExpanded({ onTestConnection })
    // The Test connection button in the form footer
    const [testBtn] = screen.getAllByRole('button', { name: /testConnection/i })
    await user.click(testBtn)
    expect(onTestConnection).toHaveBeenCalledWith('subsonic')
  })

  it('singleton schema (itunes) still renders title and enabled toggle even with no fields', () => {
    render(
      <ConnectionCard
        {...defaultProps}
        instanceKey="itunes"
        providerKey="itunes"
        schema={itunesSchema}
        config={{ enabled: true }}
        health={{ status: 'unknown', checkedAt: 0 }}
      />,
    )
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})
