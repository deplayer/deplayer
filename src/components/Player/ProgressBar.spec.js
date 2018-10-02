// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import ProgressBar from './ProgressBar'

configureEnzyme()

const setup = () => {
  const props = { }

  const enzymeWrapper = shallow(<ProgressBar {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup()
  expect(enzymeWrapper.find('.progress-bar').exists())
    .toBe(true)
})
