import * as React from 'react'
import { storiesOf } from '@storybook/react'
import Button from './index'

const stories = storiesOf('Button', module);

stories.add(
  'Button',
  () => <Button>Lorem Ipsum</Button>
)
