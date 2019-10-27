import * as React from 'react'
import { storiesOf } from '@storybook/react'
import Topbar from './Topbar'
import withProvider from '../../utils/withProvider'

const stories = storiesOf('Topbar', module);

stories
  .addDecorator(withProvider)
  .add(
    'default',
    () => <Topbar />
  )
