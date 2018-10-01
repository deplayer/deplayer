// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import Player from './Player'

configureEnzyme()

const setup = () => {
  const props = {
    playlist: {}
  }

  const enzymeWrapper = shallow(<Player {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup()
  expect(enzymeWrapper.find('.player').exists())
    .toBe(true)
})
