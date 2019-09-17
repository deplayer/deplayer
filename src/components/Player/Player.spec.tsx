import * as React from 'react'
import { shallow } from 'enzyme'

import configureEnzyme from '../../tests/configureEnzyme'
import Player from './Player'

configureEnzyme()

const setup = (definedProps: any): {props: any, enzymeWrapper: any} => {
  const props = {
    player: {},
    dispatch: jest.fn(),
    queue: {
      trackIds: [],
      currentPlaying: 'test'
    },
    itemCount: 0,
    collection: {
      rows: {
        'test': {
          name: 'test'
        }
      }
    },
    match: {
      params: {}
    },
    ...definedProps
  }

  const enzymeWrapper = shallow(<Player {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({itemCount: 1})
  expect(enzymeWrapper.find('.player').exists())
    .toBe(true)
})

it('renders handle playNext', () => {
  const props = {
    itemCount: 1
  }

  const { enzymeWrapper } = setup(props)
  enzymeWrapper.instance().playNext()
})
