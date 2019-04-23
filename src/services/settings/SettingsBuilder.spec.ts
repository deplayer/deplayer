import SettingsBuilder from './SettingsBuilder'

describe('SettingsBuilder', () => {
  it('should generate schema', () => {
    const settingsBuilder = new SettingsBuilder()

    const defaultSchema = settingsBuilder.getFormSchema()

    expect(defaultSchema.providers).toBeDefined()
    expect(defaultSchema.fields).toBeDefined()
  })
})
