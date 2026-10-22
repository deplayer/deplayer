import { describe, it, expect } from 'vitest'
import { getDurationStr } from './timeFormatter'

describe('getDurationStr', () => {
  it.each([
    [undefined, '0:00'],
    [0, '0:00'],
    [44_000, '0:44'],
    [224_867, '3:44'],
    [3_599_000, '59:59'],
    [3_600_000, '1:00:00'],
    [4_320_000, '1:12:00'],
    [36_065_000, '10:01:05'],
  ])('formats %s ms as %s', (ms, expected) => {
    expect(getDurationStr(ms)).toBe(expected)
  })
})
