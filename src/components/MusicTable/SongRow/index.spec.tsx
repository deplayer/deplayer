import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../../tests/configureEnzyme'

import Song from '../../../entities/Song'
import SongRow from './index'

configureEnzyme()


const setup = (customProps) => {
  const props = {
    song: new Song(),
    onClick: () => {},
    isCurrent: false,
    style: {},
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
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('.song-row').exists())
      .toBe(true)
  })
})
