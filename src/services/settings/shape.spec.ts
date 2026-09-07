import { describe, it, expect } from 'vitest'
import { EMPTY_SETTINGS, parseSettingsRow } from './shape'

describe('parseSettingsRow', () => {
  it('passes through a blob with the outer shape', () => {
    const blob = {
      providers: { subsonic: { enabled: true } },
      app: { language: { code: 'ca', useSystemLanguage: false } },
    }
    expect(parseSettingsRow(blob)).toEqual(blob)
  })

  it('degrades non-shape blobs to EMPTY_SETTINGS', () => {
    expect(parseSettingsRow(null)).toBe(EMPTY_SETTINGS)
    expect(parseSettingsRow(undefined)).toBe(EMPTY_SETTINGS)
    expect(parseSettingsRow('garbage')).toBe(EMPTY_SETTINGS)
    expect(parseSettingsRow(42)).toBe(EMPTY_SETTINGS)
    expect(parseSettingsRow({ providers: {} })).toBe(EMPTY_SETTINGS) // missing app
  })
})

describe('EMPTY_SETTINGS', () => {
  it('preserves absence — never invents booleans', () => {
    expect(EMPTY_SETTINGS.app.spectrum).toBeUndefined()
    expect(EMPTY_SETTINGS.app.notifications).toBeUndefined()
    expect(EMPTY_SETTINGS.app.language).toBeUndefined()
    expect(Object.keys(EMPTY_SETTINGS.providers)).toHaveLength(0)
  })
})
