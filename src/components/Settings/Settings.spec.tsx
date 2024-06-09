import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import Settings from './Settings'

const setup = (customProps: any) => {
  const defaultProps = { settings: { settingsForm: {} } }

  const props = { ...defaultProps, ...customProps }

  render(<Settings {...props} />)
}

describe('Settings', () => {
  it('renders without crashing', () => {
    expect(screen.findByRole('SettingsForm')).toBeTruthy()
  })
})
