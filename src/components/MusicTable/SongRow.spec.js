// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Song from '../../entities/Song'
import SongRow from './SongRow'

configureEnzyme()


const setup = () => {
  const props = {
    song: new Song(),
    onClick: () => {},
    isCurrent: false,
    dispatch: jest.fn()
  }

  const enzymeWrapper = shallow(<SongRow {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.song-row').exists())
      .toBe(true)
    expect(enzymeWrapper.find('button.add-to-collection').exists())
      .toBe(true)
  })
})
