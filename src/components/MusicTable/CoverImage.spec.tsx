import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Media from '../../entities/Media'
import CoverImage from './CoverImage'

configureEnzyme()

const setup = () => {
  const props = {
    song: new Media(),
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
