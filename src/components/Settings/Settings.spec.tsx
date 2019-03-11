import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'

import Settings, { formSchema } from './Settings'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {schema: formSchema}

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<Settings {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('Settings', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('.settings').exists()).toBe(true)
  })
})