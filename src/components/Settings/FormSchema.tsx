import * as React from 'react'
import { Translate } from 'react-redux-i18n'

import FormField, { TYPES } from './FormField'

type Props = {
  schema: any
}

// Convert schema object to form elements
const FormSchema = (props: Props) => {
  const { fields } = props.schema

  const populatedFields = fields.map((field, index) => {
    if (field.type === TYPES.title) {
      return <h2 key={index}><Translate value={field.title} /></h2>
    }

    return (
      <div
        key={field.name}
        className="form-group row"
      >
        <label className='col-sm-2 col-form-label'>
          <Translate value={field.title} />
        </label>
        <div className='col-sm-10'>
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
