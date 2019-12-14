import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Settings from './Settings'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {settings: {settingsForm: {}}}

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<Settings {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('Settings', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('SettingsForm').exists()).toBe(true)
  })
})
