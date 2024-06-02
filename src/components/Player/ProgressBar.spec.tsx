import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from './ProgressBar'

const setup = (customProps) => {
  const defaultProps = {}
  const props = { ...defaultProps, ...customProps }

  const enzymeWrapper = render(<ProgressBar {...props} />)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({ total: 60, current: 30 })
  expect(enzymeWrapper.find('.progress').exists())
    .toBe(true)

  expect(enzymeWrapper.find('.bar').prop('value')).toEqual(30)
})
