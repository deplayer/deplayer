import { describe, expect, it } from 'vitest'
import { saveSettings } from './index'

describe('settings saga', () => {
  describe('saveSettings', () => {
    it('should save settings', () => {
      const gen = saveSettings({ settingsPayload: {} })
      expect(gen.next().value).toBeDefined()
    })
  })
}) 
