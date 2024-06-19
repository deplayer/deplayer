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
})
