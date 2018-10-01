// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../tests/configureEnzyme'
import SongView from './SongView'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
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
