import { useState } from 'react'
import { Field, FieldProps } from 'formik'
import type { BuiltFieldSchema } from '../../types/providers'

type Props = {
  field: BuiltFieldSchema
}

const FormField = ({ field }: Props) => {
  const [showPassword, setShowPassword] = useState(false)

  const description = field.description ? (
    <p className="text-xs text-base-content/60 mt-1">{field.description}</p>
  ) : null

  if (field.type === 'boolean') {
    return (
      <div>
        <Field name={field.name}>
          {({ field: f }: FieldProps) => (
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={f.value}
              {...f}
            />
          )}
        </Field>
        {description}
      </div>
    )
  }

  if (field.type === 'password') {
    return (
      <div>
        <div className="flex gap-2">
          <Field
            name={field.name}
            type={showPassword ? 'text' : 'password'}
            className="input input-bordered w-full"
            placeholder={field.placeholder}
          />
          <button
            type="button"
            className="btn btn-sm btn-ghost self-center"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {description}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        <Field
          as="select"
          name={field.name}
          className="select select-bordered w-full"
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Field>
        {description}
      </div>
    )
  }

  return (
    <div>
      <Field
        name={field.name}
        type={field.type}
        className="input input-bordered w-full"
        placeholder={field.placeholder}
      />
      {description}
    </div>
  )
}

export default FormField
