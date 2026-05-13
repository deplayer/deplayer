import { Translate } from 'react-redux-i18n'
import FormField from './FormField'
import SyncButton from '../Buttons/SyncButton'
import type { FormField as FormFieldType, BuiltFieldSchema } from '../../types/providers'

type Props = {
  schema: { fields: FormFieldType[] }
}

const FormSchema = ({ schema }: Props) => {
  return (
    <>
      {schema.fields.map((field, index) => {
        if (field.type === 'title') {
          return (
            <h3 key={`title-${index}`} className="text-2xl leading-loose py-2 uppercase tracking-wide pt-4 pb-2">
              <Translate value={field.label} />
            </h3>
          )
        }

        if (field.type === 'sync') {
          return <SyncButton key={`sync-${field.providerKey}`} providerKey={field.providerKey} />
        }

        // It's a BuiltFieldSchema (FieldSchema + name) from SettingsBuilder
        const builtField = field as BuiltFieldSchema
        return (
          <div key={`field-${builtField.name}`} className="my-3">
            <div className="w-full flex items-center">
              <label className="w-40 capitalize text-xl" htmlFor="form-field-label">
                <Translate value={field.label} />
              </label>
              <FormField field={builtField} />
            </div>
          </div>
        )
      })}
    </>
  )
}

export default FormSchema
