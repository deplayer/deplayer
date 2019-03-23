import * as React from 'react'
import { shallow } from 'enzyme'
import Slider from 'rc-slider'

import configureEnzyme from '../../tests/configureEnzyme'
import VolumeControl from './VolumeControl'

configureEnzyme()

const setup = (customProps) => {
  const defaultProps = {
    keyValues: [],
    onChange: jest.fn()
  }
  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<VolumeControl {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({volume: 50})
  expect(enzymeWrapper.find(Slider).exists())
    .toBe(true)
})
