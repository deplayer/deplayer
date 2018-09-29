// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../tests/configureEnzyme'
import Collection from './Collection'

configureEnzyme()

const setup = () => {
  const props = {
    data: [],
    page: 1,
    pages: 10,
    total: 100,
    offset: 10,
    dispatch: () => {}
  }

  const enzymeWrapper = shallow(<Collection {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup()
  expect(enzymeWrapper.find('.collection').exists())
    .toBe(true)
})
