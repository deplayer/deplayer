import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import SettingsForm from './SettingsForm'

const mockStore = configureStore([])

const setup = (customProps: any) => {
  const schema = {
    providers: {},
    fields: [
      { title: "labels.mstream", type: 'title' },
      { title: "labels.enabled", name: 'providers.mstream.enabled', type: 'checkbox' },
      { title: "labels.mstream.baseUrl", name: 'providers.mstream.baseUrl', type: 'url' }
    ]
  }

  const defaultProps = {
    schema: schema,
    settings: {
      settingsForm: schema,
      settings: {
        providers: {},
        app: {
          language: {
            useSystemLanguage: true,
            code: 'en'
          }
        }
      },
    },
    onSubmit: () => Promise.resolve()
  }

  const props = { ...defaultProps, ...customProps }
  const store = mockStore({
    i18n: {
      translations: {
        buttons: {
          saveSettings: 'Save Settings'
        }
      }
    }
  })

  render(
    <Provider store={store}>
      <SettingsForm {...props} schema={schema} dispatch={() => {}} />
    </Provider>
  )
}

describe('SettingsForm', () => {
  it('renders without crashing', () => {
    setup({})
    expect(screen.getByRole('button', { name: /save settings/i })).toBeTruthy()
  })
})
