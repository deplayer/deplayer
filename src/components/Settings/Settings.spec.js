// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Settings from './Settings'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = { }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<Settings {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('Settings', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.settings').exists()).toBe(true)
    expect(enzymeWrapper.find('h1').exists()).toBe(true)
  })
})
