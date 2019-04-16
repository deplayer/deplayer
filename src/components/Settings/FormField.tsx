import * as React from 'react'
import { Field } from 'formik'
import Toggle from 'react-toggle'

require("react-toggle/style.css")

type Props = {
  field: any
}

export const TYPES = {
  title: 'title',
  checkbox: 'checkbox'
}

const FormikToggle = ({
  field,
  form: {touched, errors},
  ...props
}) => {
  return (
    <Toggle
      id={field.name}
      name={field.name}
      checked={field.value}
      value={field.name}
      onChange={field.onChange}
    />
  )
}

const FormField = (props: Props) => {
  const { field } = props

  if (field.type === TYPES.checkbox) {
    return (
      <div className='toggle-control'>
        <Field
          name={field.name}
          component={FormikToggle}
        />
      </div>
    )
  }

  return (
    <Field
      className={`${ field.type === TYPES.checkbox ? 'form-check': 'form-control'}`}
      name={field.name}
      type={field.type}
    />
  )
}

export default FormField
