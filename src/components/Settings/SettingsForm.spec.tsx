import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import type { State as SettingsStateType } from '../../reducers/settings'
import type { UnknownAction } from 'redux'

import { SettingsForm } from './SettingsForm'

const mockStore = configureStore([])

interface SetupProps {
  schema?: {
    providers: Record<string, unknown>;
    fields: Array<{
      title: string;
      name?: string;
      type: string;
    }>;
  };
  settings?: {
    settingsForm: {
      providers: Record<string, unknown>;
      fields: Array<{
        title: string;
        name?: string;
        type: string;
      }>;
    };
    settings: SettingsStateType['settings'];
  };
  onSubmit?: () => Promise<void>;
  dispatch?: (action: UnknownAction) => UnknownAction;
}

const setup = (customProps: Partial<SetupProps> = {}) => {
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
          },
          notifications: {
            enabled: true,
            showTrackChanges: true,
            showErrors: true
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
        labels: {
          save: 'Save',
          language: 'Language',
          useSystemLanguage: 'Use system language',
          notifications: 'Notifications',
          enableNotifications: 'Enable Notifications',
          showTrackChanges: 'Show Track Changes',
          showErrors: 'Show Errors'
        }
      }
    }
  })

  render(
    <Provider store={store}>
      <SettingsForm {...props} schema={schema} dispatch={(action: UnknownAction) => action} />
    </Provider>
  )
}

describe('SettingsForm', () => {
  it('renders without crashing', () => {
    setup({})
    const submitButton = screen.getByTestId('settings-submit')
    expect(submitButton).toBeTruthy()
    expect(submitButton).toHaveClass('btn', 'btn-primary')
  })

  it('renders language settings', () => {
    setup({})
    expect(screen.getByText('language')).toBeTruthy()
    expect(screen.getByText('useSystemLanguage')).toBeTruthy()
  })

  it('renders notification settings', () => {
    setup({})
    expect(screen.getByText('notifications')).toBeTruthy()
    expect(screen.getByText('enableNotifications')).toBeTruthy()
    expect(screen.getByText('showTrackChanges')).toBeTruthy()
    expect(screen.getByText('showErrors')).toBeTruthy()
  })
})
