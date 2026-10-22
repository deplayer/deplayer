import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Formik } from 'formik'

import FormField from './FormField'

const setup = (customProps: any) => {
  const defaultProps = {
    field: {}
  }

  const props = { ...defaultProps, ...customProps }

  render(<Formik initialValues={{}} onSubmit={(foo: any) => foo}>{() => (<FormField {...props} />)}</Formik>)
}

describe('FormField', () => {
  it('renders without crashing', () => {
    setup({})
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it.each(['text', 'url', 'password'] as const)('binds %s input to its value', (type) => {
    render(
      <Formik initialValues={{ x: 'hello' }} onSubmit={() => undefined}>
        <FormField field={{ key: 'x', name: 'x', type, label: 'x' }} />
      </Formik>,
    )
    expect(document.getElementById('field-x')).toHaveValue('hello')
  })

  it('binds select to its value', () => {
    render(
      <Formik initialValues={{ x: 'b' }} onSubmit={() => undefined}>
        <FormField field={{ key: 'x', name: 'x', type: 'select', label: 'x', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] }} />
      </Formik>,
    )
    expect(document.getElementById('field-x')).toHaveValue('b')
  })
})
