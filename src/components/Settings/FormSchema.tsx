import { Translate } from 'react-redux-i18n'

import FormField, { TYPES } from './FormField'
import SyncButton from '../Buttons/SyncButton'

interface Field {
  title: string
  name: string
  type: string
}
type Props = {
  providerKey?: string
  schema: { fields: Field[] }
}

// Convert schema object to form elements
const FormSchema = (props: Props) => {
  const { fields } = props.schema

  const populatedFields = fields.map((field: Field, index: number) => {
    if (field.type === TYPES.title) {
      return (
        <h3 className='text-2xl leading-loose py-2 uppercase tracking-wide pt-4 pb-2' key={index}><Translate value={field.title} /></h3>
      )
    }

    if (field.type === "sync" && props.providerKey) {
      return <SyncButton providerKey={props.providerKey} />;
    }

    return (
      <div
        key={field.name}
        className="my-3"
      >
        <div className='w-full flex items-center'>
          <label className='w-40 capitalize text-xl'>
            <Translate value={field.title} />
          </label>
          <FormField
            field={field}
          />
        </div>
      </div>
    )
  })

  return populatedFields
}

export default FormSchema
