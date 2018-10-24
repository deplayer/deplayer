// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Song from '../../entities/Song'
import CoverImage from './CoverImage'

configureEnzyme()

const setup = () => {
  const props = {
    song: new Song(),
    size: 'thumbnail',
    albumName: 'My album',
    cover: {
      fullUrl: '',
      thumbnailUrl: '',
    },
    isCurrent: false
  }

  const enzymeWrapper = shallow(<CoverImage {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('CoverImage', () => {
  it('should show render without errors', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('Img').exists())
      .toBe(true)
  })
})
