import SettingsService from './SettingsService'
import DummyAdapter from '../database/DummyAdapter'

describe('SettingsService', () => {
  it('should handle save', () => {
    const settingsService = new SettingsService(new DummyAdapter())

    expect.assertions(1)

    settingsService.save('123', {mySetting: 'value'})
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
