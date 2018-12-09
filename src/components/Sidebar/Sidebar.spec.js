// @flow

import React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import Sidebar from './Sidebar'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    dispatch: () => {},
    loading: false,
    playlist: {}
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<Sidebar {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('Sidebar', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup()
    expect(enzymeWrapper.find('.search-bar').exists()).toBe(true)
    expect(enzymeWrapper.find('.search-bar > input').exists()).toBe(true)
    enzymeWrapper.find('input').simulate('change', {target: {value: 'Pink Floyd'}});
    expect(enzymeWrapper.state('searchTerm')).toBe('Pink Floyd');
    expect(enzymeWrapper.find('i.search.icon').exists()).toBe(true)
  })

  it('should render loading spinner icon while loading', () => {
    const { enzymeWrapper } = setup({loading: true})
    expect(enzymeWrapper.find('.search-bar.loading').exists()).toBe(true)
  })
})
