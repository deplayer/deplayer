import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import FormField from './FormField'

const setup = (customProps: any) => {
  const defaultProps = {
    field: {}
  }

  const props = { ...defaultProps, ...customProps }

  render(<FormField {...props} />)
}

describe('FormField', () => {
  it('renders without crashing', () => {
    setup({})
    expect(screen.getByRole('textbox')).toBeTruthy()
  })
})
