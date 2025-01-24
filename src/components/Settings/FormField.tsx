import { Field } from 'formik'
import Toggle from 'react-toggle'
import { useFormikContext } from 'formik'
import { FormField as FormFieldType } from '../../types/forms'

import 'react-toggle/style.css'

type Props = {
  field: FormFieldType
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
      className="input input-bordered w-full"
      name={props.field.name}
      type={props.field.type}
    />
  )
}

export default FormField
