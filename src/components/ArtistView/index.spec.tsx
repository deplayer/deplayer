import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import ArtistView from './index'
import Artist from '../../entities/Artist'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    artist: new Artist(),
    albums: [],
    songs: []
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<ArtistView {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('ArtisView', () => {
  it('render song without crash', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('.artist-view').exists()).toBe(true)
  })
})
