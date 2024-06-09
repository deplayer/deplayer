import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import VolumeControl from './VolumeControl'

const setup = (customProps: any) => {
  const defaultProps = {
    keyValues: [],
  }
  const props = { ...defaultProps, ...customProps }

  render(<VolumeControl {...props} />)
}

it('renders without crashing', () => {
  setup({ volume: 50 })
  expect(screen.findByRole('slider'))
    .toBeTruthy()
})
