import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCoverImage } from './useCoverImage'

vi.mock('../services/CoverImageService', () => ({
  coverImageService: {
    request: vi.fn(),
  },
}))

import { coverImageService } from '../services/CoverImageService'

describe('useCoverImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('should return undefined initially then object URL when loaded', async () => {
    vi.mocked(coverImageService.request).mockResolvedValue('blob:loaded')

    const { result } = renderHook(() => useCoverImage('https://example.com/cover'))

    expect(result.current).toBeUndefined()

    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    expect(result.current).toBe('blob:loaded')
  })

  it('should return undefined when no URL provided', () => {
    const { result } = renderHook(() => useCoverImage(undefined))
    expect(result.current).toBeUndefined()
    expect(coverImageService.request).not.toHaveBeenCalled()
  })

  it('should revoke object URL on unmount', async () => {
    vi.mocked(coverImageService.request).mockResolvedValue('blob:to-revoke')

    const { unmount } = renderHook(() => useCoverImage('https://example.com/cover'))

    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:to-revoke')
  })
})
