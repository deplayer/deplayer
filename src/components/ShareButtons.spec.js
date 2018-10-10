// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../tests/configureEnzyme'

import ShareButtons from './ShareButtons'
import Song from '../entities/Song'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Song({shareUrl: '1234'})
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<ShareButtons {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('ShareButtons', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.share-buttons').exists()).toBe(true)
  })
})
