// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import VolumeControl from './VolumeControl'

configureEnzyme()

const setup = (customProps) => {
  const defaultProps = {
    keyValues: []
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
  expect(enzymeWrapper.find('input.form-control-range').exists())
    .toBe(true)
})
