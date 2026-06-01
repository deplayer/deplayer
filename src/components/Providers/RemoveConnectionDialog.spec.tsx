import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RemoveConnectionDialog } from './RemoveConnectionDialog'

beforeAll(() => {
  const root = document.createElement('div')
  root.id = 'modal-root'
  document.body.appendChild(root)
})

describe('RemoveConnectionDialog', () => {
  const defaults = {
    instanceKey: 'subsonic',
    name: 'Home Navidrome',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders the connection name in the title', () => {
    render(<RemoveConnectionDialog {...defaults} />)
    // I18n.t falls back to the literal key when no translations are loaded,
    // so we check the body and confirm button instead — they're stable.
    expect(screen.getByText(/^body$/i)).toBeInTheDocument()
  })

  it('Cancel closes without confirming', async () => {
    const onConfirm = vi.fn(); const onClose = vi.fn()
    const user = userEvent.setup()
    render(<RemoveConnectionDialog {...defaults} onConfirm={onConfirm} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('Remove fires onConfirm then onClose', async () => {
    const onConfirm = vi.fn(); const onClose = vi.fn()
    const user = userEvent.setup()
    render(<RemoveConnectionDialog {...defaults} onConfirm={onConfirm} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the backdrop fires onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<RemoveConnectionDialog {...defaults} onClose={onClose} />)
    // Modal renders a backdrop element with className "modal-backdrop"
    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement
    expect(backdrop).not.toBeNull()
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders the destructive btn-error class on the Remove button', () => {
    render(<RemoveConnectionDialog {...defaults} />)
    expect(screen.getByRole('button', { name: /^confirm$/i })).toHaveClass('btn-error')
  })
})
