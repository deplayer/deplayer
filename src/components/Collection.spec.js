import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Collection from './Collection'

configure({ adapter: new Adapter() })

const setup = () => {
  const props = {
    data: [],
    page: 1,
    pages: 10,
    total: 100,
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
