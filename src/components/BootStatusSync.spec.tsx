import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { BootStatusSync } from './BootStatusSync'
import { useUIStore } from '../stores/uiStore'
import { useMediaCount } from '../stores/livestore/hooks'

vi.mock('../stores/livestore/hooks', () => ({
  useMediaCount: vi.fn(),
}))

const mockCount = vi.mocked(useMediaCount)

describe('BootStatusSync', () => {
  beforeEach(() => {
    useUIStore.setState({ bootStatus: 'booting' })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('holds booting while the media count is not a number yet', () => {
    // The count query reports undefined until its first result.
    mockCount.mockReturnValue(undefined as unknown as number)
    render(<BootStatusSync />)
    expect(useUIStore.getState().bootStatus).toBe('booting')
  })

  it('reports empty for a zero count', () => {
    mockCount.mockReturnValue(0)
    render(<BootStatusSync />)
    expect(useUIStore.getState().bootStatus).toBe('empty')
  })

  it('moves empty -> ready when the library fills after boot', () => {
    mockCount.mockReturnValue(0)
    const { rerender } = render(<BootStatusSync />)
    expect(useUIStore.getState().bootStatus).toBe('empty')

    mockCount.mockReturnValue(3)
    rerender(<BootStatusSync />)
    expect(useUIStore.getState().bootStatus).toBe('ready')
  })
})
