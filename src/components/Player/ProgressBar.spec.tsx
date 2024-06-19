import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from './ProgressBar'

it('renders without crashing', async () => {
  const props = { total: 60, current: 30 }

  render(<ProgressBar {...props} />)

  expect(screen.getByRole('slider', { value: { now: 30 } })).toBeTruthy()
})
