// @flow

import React from 'react'
import { Translate }  from 'react-redux-i18n'
import { Form, Button } from 'semantic-ui-react'

const Settings = () => {
  return (
    <div className='settings'>
      <h1><Translate value="titles.settings" /></h1>

      <h2><Translate value="titles.providers" /></h2>
      <h3><Translate value="titles.mstream" /></h3>

      <Form>
        <Form.Field>
          <label><Translate value="labels.mstream.baseUrl" /></label>
          <Form.Input fluid type='text' name='baseUrl' />
        </Form.Field>
        <Button type='submit'><Translate value="buttons.mstream.save" /></Button>
      </Form>
    </div>
  )
}

export default Settings
