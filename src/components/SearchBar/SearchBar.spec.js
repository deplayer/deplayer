// @flow

import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import SearchBar from './SearchBar'

configure({ adapter: new Adapter() })

const setup = () => {
  const props = {
    dispatch: () => {}
  }

  const enzymeWrapper = shallow(<SearchBar {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup()
  expect(enzymeWrapper.find('.search-bar').exists()).toBe(true)
  expect(enzymeWrapper.find('.search-bar > input').exists()).toBe(true)
  enzymeWrapper.find('input').simulate('change', {target: {value: 'Pink Floyd'}});
  expect(enzymeWrapper.state('searchTerm')).toBe('Pink Floyd');
})
