import { describe, it, expect } from 'vitest'
import { shallow } from 'enzyme'

import configureEnzyme from '../../tests/configureEnzyme'

import FormField from './FormField'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    field: {}
  }

  const props = { ...defaultProps, ...customProps }

  const enzymeWrapper = shallow(<FormField {...props} />)

  return {
    props,
    enzymeWrapper,
  }
}

describe('FormField', () => {
  it('renders without crashing', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('.form-control').exists()).toBe(true)
  })

  it('should render a Toggle if type is checkbox', () => {
    const { enzymeWrapper } = setup({
      field: {
        type: 'checkbox'
      }
    })
    // TODO: idk how to assert the result of toggle
    // expect(enzymeWrapper.find('FormikToggle').exists()).toBe(true)
  })
})
