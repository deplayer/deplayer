// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import MusicTable from './index'

configureEnzyme()


const setup = () => {
  const props = {
    data: [],
    page: 1,
    pages: 10,
    total: 100,
    offset: 10,
    dispatch: () => {}
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
