// @flow

import React from 'react'
import { mount } from 'enzyme'
import configureEnzyme from './tests/configureEnzyme'
import App from './App'

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

  const enzymeWrapper = mount(<App {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup()
  expect(enzymeWrapper.find('Provider').exists())
    .toBe(true)
  expect(enzymeWrapper.find('Router').exists())
    .toBe(true)
  expect(enzymeWrapper.find('Sidebar').exists())
    .toBe(true)
  expect(enzymeWrapper.find('Player').exists())
    .toBe(true)
})
