import { Field } from 'formik'
import Toggle from 'react-toggle'
import { useFormikContext } from 'formik'

import 'react-toggle/style.css'

interface Field {
  title: string
  name: string
  type: string
}
type Props = {
  field: Field
}

export const TYPES = {
  title: 'title',
  checkbox: 'checkbox'
}

const FormikToggle = ({
  field,
}: { field: any }) => {
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
  if (props.field.type === TYPES.checkbox) {
    return (
      <div className='w-full toggle-control flex justify-end'>
        <Field
          name={props.field.name}
          component={FormikToggle}
        />
      </div>
    )
  }

  return (
    <Field
      className={`
      ${props.field.type === TYPES.checkbox ? 'form-check' : 'form-control'}
      p-3
      w-24
      w-full
      bg-blue-900
      text-blue-100
      font-sans
      rounded
      text-lg
    `}
      name={props.field.name}
      type={props.field.type}
    />
  )
}

export default FormField
