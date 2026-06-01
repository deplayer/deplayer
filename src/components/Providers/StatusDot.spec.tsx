import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatusDot } from './StatusDot'
import type { HealthStatus } from '../../types/providers'

describe('StatusDot', () => {
  it.each<[HealthStatus, string]>([
    ['connected', 'Connected'],
    ['checking', 'Checking…'],
    ['unreachable', 'Unreachable'],
    ['authFailed', 'Authentication failed'],
    ['disabled', 'Disabled'],
    ['unknown', 'Status unknown'],
  ])('renders %s with aria-label %s', (status, label) => {
    render(<StatusDot status={status} />)
    expect(screen.getByLabelText(label)).toBeInTheDocument()
  })

  it('renders the checking state with a pulse class', () => {
    const { container } = render(<StatusDot status="checking" />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('renders the disabled state as a hollow ring', () => {
    const { container } = render(<StatusDot status="disabled" />)
    expect(container.firstChild).toHaveClass('ring-1')
  })

  it('appends a custom className', () => {
    const { container } = render(<StatusDot status="connected" className="ml-2" />)
    expect(container.firstChild).toHaveClass('ml-2')
  })
})
