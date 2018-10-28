// @flow

import React from 'react'
import { shallow } from 'enzyme'
import { Translate } from 'react-redux-i18n'
import configureEnzyme from '../../tests/configureEnzyme'

import SettingsForm from './SettingsForm'

configureEnzyme()

const setup = (customProps: any) => {
  const schema = {
    fields: [
      {title: <Translate value="labels.mstream" />, type: 'title'},
      {title: <Translate value="labels.enabled" />, name: 'providers.mstream.enabled', type: 'checkbox'},
      {title: <Translate value="labels.mstream.baseUrl" />, name: 'providers.mstream.baseUrl', type: 'url'}
    ]
  }

  const defaultProps = {
    schema,
    settings: {
      settings: {}
    },
    onSubmit: () => Promise
  }

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
