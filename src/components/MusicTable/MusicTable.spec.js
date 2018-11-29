// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import MusicTable from './MusicTable'

configureEnzyme()


const setup = () => {
  const props = {
    dispatch: () => {},
    tableIds: [],
    queue: {
      trackIds: [],
      currentPlaying: {},
    },
    totalSongs: 10,
    collection: {}
  }

  const enzymeWrapper = shallow(<MusicTable {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('MusicTable', () => {
  it('Should show errors', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.music-table').exists())
      .toBe(true)
  })
})
