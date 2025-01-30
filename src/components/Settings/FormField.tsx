import { Field } from 'formik'
import { FormField as FormFieldType } from '../../types/forms'

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
            <input
              type="checkbox"
              {...field}
              id={field.name}
              checked={field.value}
              className="toggle toggle-primary"
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
