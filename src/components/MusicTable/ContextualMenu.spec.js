// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import ContextualMenu from './ContextualMenu'

configureEnzyme()

const setup = (customProps) => {
  const props = {
    song: {},
    disableAddButton: false
  }

  const finalProps = {...props, ...customProps}

  const enzymeWrapper = shallow(<ContextualMenu {...finalProps}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('ContextualMenu', () => {
  it('should show add-to-collection button when disableAddButton is false', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('button.add-to-collection').exists())
      .toBe(true)
  })
  it('should show remove button when disableAddButton is true', () => {
    const { enzymeWrapper } = setup({disableAddButton: true})
    expect(enzymeWrapper.find('button.remove-from-collection').exists())
      .toBe(true)
  })
})
