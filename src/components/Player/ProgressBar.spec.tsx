import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import ProgressBar from './ProgressBar'

configureEnzyme()

const setup = (customProps) => {
  const defaultProps = {}
  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<ProgressBar {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({total: 60, current: 30})
  expect(enzymeWrapper.find('.progress').exists())
    .toBe(true)

  expect(enzymeWrapper.find('.bar').prop('value')).toEqual(30)
})
