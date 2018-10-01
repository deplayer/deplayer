// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../tests/configureEnzyme'
import SongView from './SongView'
import Song from '../entities/Song'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Song()
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<SongView {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('SongView', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.song-view').exists()).toBe(true)
  })
})
