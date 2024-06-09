import { describe, it, expect } from 'vitest'
import { isTrack } from './format-utils'

describe('format-utils', () => {
  describe('isTrack', () => {
    it('should handle mp3 files', () => {
      expect(isTrack('test.mp3')).toBe(true)
      expect(isTrack('test')).toBe(false)
      expect(isTrack('/Coksparrer')).toBe(false)
    })
  })
})
