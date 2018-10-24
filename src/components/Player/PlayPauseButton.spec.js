// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import PlayPauseButton from './PlayPauseButton'

configureEnzyme()

const setup = (customProps) => {
  const defaultProps = {
    onClick: () => {}
  }
  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<PlayPauseButton {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({playing: true})
  expect(enzymeWrapper.find('.play-pause').exists())
    .toBe(true)

  expect(enzymeWrapper.find('.play-pause i.pause').exists())
    .toBe(true)
})
