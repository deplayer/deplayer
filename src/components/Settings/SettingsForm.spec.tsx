import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SettingsForm from './SettingsForm'

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
        providers: {}
      },
    },
    onSubmit: () => Promise.resolve()
  }

  const props = { ...defaultProps, ...customProps }

  render(<SettingsForm {...props} schema={schema} />)
}

describe('SettingsForm', () => {
  it('renders without crashing', () => {
    setup({})
    expect(screen.getByRole('button')).toBeTruthy()
  })
})
