import * as React from 'react'
import jest from 'jest'

import { shallow } from 'enzyme'

import PlayerControls from './PlayerControls'
import Player from './Player'
import configureEnzyme from '../../tests/configureEnzyme'

configureEnzyme()

const setup = (definedProps: any): {props: any, enzymeWrapper: any} => {
  const props = {
    player: {
      showPlayer: false
    },
    dispatch: () => {},
    PlayerComponent: Player,
    queue: {
      trackIds: [],
      currentPlaying: 'test'
    },
    itemCount: 0,
    settings: { settings: { app: { ipfs: {} } } },
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

  const enzymeWrapper = shallow(<PlayerControls {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

it('renders without crashing', () => {
  const { enzymeWrapper } = setup({itemCount: 1, player: { showPlayer: true }})
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
