import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import Topbar from './Topbar'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    dispatch: () => {},
    loading: false,
    searchToggled: true,
    playlist: {}
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<Topbar {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('Topbar', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('.search-bar').exists()).toBe(true)
    expect(enzymeWrapper.find('.search-bar > input').exists()).toBe(true)
    enzymeWrapper.find('input').simulate('change', {currentTarget: {value: 'Pink Floyd'}});
    expect(enzymeWrapper.find('i.search.icon').exists()).toBe(true)
  })

  it('should render loading spinner icon while loading', () => {
    const { enzymeWrapper } = setup({loading: true})
    expect(enzymeWrapper.find('.search-bar.loading').exists()).toBe(true)
  })
})