// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import SkipButton from './SkipButton'

configureEnzyme()

const setup = (customProps) => {
  const defaultProps = {}
  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<SkipButton {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing for next type', () => {
  const { enzymeWrapper } = setup({type: 'next', onClick: () => {}})
  expect(enzymeWrapper.find('.icon.step.forward').exists())
    .toBe(true)
})

it('renders without crashing for prev type', () => {
  const { enzymeWrapper } = setup({type: 'prev', onClick: () => {}})
  expect(enzymeWrapper.find('.icon.step.backward').exists())
    .toBe(true)
})
