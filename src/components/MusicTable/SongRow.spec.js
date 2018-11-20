// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Song from '../../entities/Song'
import SongRow from './SongRow'

configureEnzyme()


const setup = (customProps) => {
  const props = {
    song: new Song(),
    onClick: () => {},
    isCurrent: false,
    dispatch: jest.fn(),
    disableAddButton: false
  }

  const finalProps = {...props, ...customProps}

  const enzymeWrapper = shallow(<SongRow {...finalProps}/>)

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

  it('should show remove button when disableAddButton is true', () => {
    const { enzymeWrapper } = setup({disableAddButton: true})
    expect(enzymeWrapper.find('button.remove-from-collection').exists())
      .toBe(true)
  })
})
