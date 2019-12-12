import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs';
import * as React from 'react'

import Media from '../../entities/Media'
import SongView from './index'
import withProvider from '../../utils/withProvider'

const stories = storiesOf('SongView', module);
const song = new Media()

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <SongView
        dispatch={() => console.log('story')}
        queue={{ trackIds: [] }}
        song={song}
        loading={boolean('loading', false)}
      />
    )
  )
