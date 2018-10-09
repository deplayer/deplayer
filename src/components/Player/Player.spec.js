// @flow

import React from 'react'
import { shallow } from 'enzyme'
import { Dispatch } from 'redux'

import configureEnzyme from '../../tests/configureEnzyme'
import Player from './Player'

configureEnzyme()

const setup = (definedProps: any) => {
  const props = {
    playlist: {},
    collection: {
      rows: {}
    },
    dispatch: Dispatch,
    ...definedProps
  }

  const enzymeWrapper = shallow(<Player {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({})
  expect(enzymeWrapper.find('.player').exists())
    .toBe(true)
})

it('renders handle playNext', () => {
  const props = {
    playlist: {
      trackIds: []
    }
  }

  const { enzymeWrapper } = setup(props)
  enzymeWrapper.instance().playNext()
})
