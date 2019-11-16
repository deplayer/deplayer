import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'

import LazyImage from './'
import withProvider from '../../utils/withProvider'

const stories = storiesOf('LazyImage', module)

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <div className='bg-blue-900'>
        <LazyImage
          className='w-48 h-48'
          src='https://is4-ssl.mzstatic.com/image/thumb/Music49/v4/91/2c/cb/912ccb21-fcc4-269c-eab4-132a2407b286/source/600x600bb.jpg'
        />
      </div>
    )
  )
