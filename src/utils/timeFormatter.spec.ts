import { describe, it, expect } from 'vitest'
import { getDurationStr } from './timeFormatter'

describe('timFormatter', () => {
  it('getDurationStr', () => {
    expect(getDurationStr(224867)).toBe('3:44')
  })
})
