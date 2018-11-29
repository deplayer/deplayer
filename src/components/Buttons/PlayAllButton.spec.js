// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import PlayAllButton from './PlayAllButton'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {}

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<PlayAllButton {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('PlayAllButton', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.playall-button').exists()).toBe(true)
  })
})
