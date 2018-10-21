// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import SettingsForm from './SettingsForm'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = { }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<SettingsForm {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('SettingsForm', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('Formik').exists()).toBe(true)
  })
})
