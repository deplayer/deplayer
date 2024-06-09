import { Field, FormikProvider } from 'formik'
import Toggle from 'react-toggle'
import { useFormik, useFormikContext } from 'formik'

import 'react-toggle/style.css'

type Props = {
  field: any
}

export const TYPES = {
  title: 'title',
  checkbox: 'checkbox'
}

const FormikToggle = ({
  field,
  form,
  ...props
}) => {
  useFormikContext()

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
  const formik = useFormik({})
  const { field } = props

  if (field.type === TYPES.checkbox) {
    return (
      <FormikProvider value={formik}>
        <div className='w-full toggle-control flex justify-end'>
          <Field
            name={field.name}
            component={FormikToggle}
          />
        </div>
      </FormikProvider>
    )
  }

  return (
    <FormikProvider value={formik}>
      <Field
        className={`
        ${field.type === TYPES.checkbox ? 'form-check' : 'form-control'}
        p-3
        w-24
        w-full
        bg-blue-900
        text-blue-100
        font-sans
        rounded
        text-lg
      `}
        name={field.name}
        type={field.type}
      />
    </FormikProvider>
  )
}

export default FormField
