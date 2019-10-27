import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs';
import * as React from 'react'

import Song from '../../entities/Song'
import SongView from './SongView'
import withProvider from '../../utils/withProvider'

const stories = storiesOf('SongView', module);
const song = new Song()

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <SongView
        dispatch={() => console.log('story')}
        queue={{}}
        song={song}
        loading={boolean('loading', false)}
      />
    )
  )
