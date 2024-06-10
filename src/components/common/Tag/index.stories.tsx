import { storiesOf } from '@storybook/react'
import Tag from './index'

const stories = storiesOf('Tag', module);

stories
  .add(
    'plain Tag',
    () => <Tag>Lorem Ipsum</Tag>
  )
  .add(
    'primary Tag',
    () => <Tag type='primary'>Lorem Ipsum</Tag>
  )
