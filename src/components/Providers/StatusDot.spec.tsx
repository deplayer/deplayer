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

  it('renders the checking state with a motion-safe pulse', () => {
    const { container } = render(<StatusDot status="checking" />)
    expect(container.firstChild).toHaveClass('motion-safe:animate-pulse')
  })

  it('renders the connected state with the success token', () => {
    const { container } = render(<StatusDot status="connected" />)
    expect(container.firstChild).toHaveClass('bg-success')
  })

  it('renders error states with the error token', () => {
    const { container: a } = render(<StatusDot status="unreachable" />)
    expect(a.firstChild).toHaveClass('bg-error')
    const { container: b } = render(<StatusDot status="authFailed" />)
    expect(b.firstChild).toHaveClass('bg-error')
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
