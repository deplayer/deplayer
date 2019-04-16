import SettingsBuilder from './SettingsBuilder'

describe('SettingsBuilder', () => {
  it('should generate schema', () => {
    const settingsBuilder = new SettingsBuilder()

    expect(settingsBuilder.getFormSchema()).toBeDefined()
  })
})
