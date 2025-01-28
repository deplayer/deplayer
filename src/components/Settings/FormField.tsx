import { Field } from 'formik'
import Toggle from 'react-toggle'
import { FormField as FormFieldType } from '../../types/forms'

import 'react-toggle/style.css'

type Props = {
  field: FormFieldType
}

export const TYPES = {
  title: 'title',
  checkbox: 'checkbox'
}

const FormField = (props: Props) => {
  const fieldName = props.field.name || ''

  if (props.field.type === TYPES.checkbox) {
    return (
      <div className='w-full toggle-control flex justify-end'>
        <Field name={fieldName}>
          {({ field }: any) => (
            <Toggle
              {...field}
              id={field.name}
              checked={field.value}
            />
          )}
        </Field>
      </div>
    )
  }

  return (
    <Field
      name={fieldName}
      type={props.field.type}
      className="input input-bordered w-full"
    />
  )
}

export default FormField
