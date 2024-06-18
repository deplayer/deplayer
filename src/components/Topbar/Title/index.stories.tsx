import { storiesOf } from '@storybook/react'
import Title from './index'

const stories = storiesOf('Title', module);

stories
  .add(
    'plain Title',
    () => (
      <Title
        onClick={() => console.log('title clicked')}
        title='Lorem Ipsum'
      />
    )
  )
