// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import SettingsButton from './SettingsButton'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {}

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<SettingsButton {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('SettingsButton', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.settings-button').exists()).toBe(true)
  })
})
