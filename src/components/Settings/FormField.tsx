import { useState } from 'react'
import { Field, FieldProps } from 'formik'
import type { BuiltFieldSchema } from '../../types/providers'

type Props = {
  field: BuiltFieldSchema
}

const FormField = ({ field }: Props) => {
  const [showPassword, setShowPassword] = useState(false)

  // Every input shares these; a Field without `name` binds to the whole values object.
  const common = { name: field.name, id: `field-${field.name}` }

  const description = field.description ? (
    <p className="text-xs text-base-content/60 mt-1">{field.description}</p>
  ) : null

  let input
  switch (field.type) {
    case 'boolean':
      input = (
        <Field {...common}>
          {({ field: f }: FieldProps) => (
            <input
              id={common.id}
              type="checkbox"
              className="toggle toggle-primary"
              checked={f.value}
              {...f}
            />
          )}
        </Field>
      )
      break
    case 'password':
      input = (
        <div className="flex gap-2">
          <Field
            {...common}
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
      )
      break
    case 'select':
      input = (
        <Field {...common} as="select" className="select select-bordered w-full">
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Field>
      )
      break
    default:
      input = (
        <Field
          {...common}
          type={field.type}
          className="input input-bordered w-full"
          placeholder={field.placeholder}
        />
      )
  }

  return (
    <div>
      {input}
      {description}
    </div>
  )
}

export default FormField
