import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import * as React from 'react'

import Song from '../../../entities/Song'
import SongRow from './index'
import withProvider from '../../../utils/withProvider'

const stories = storiesOf('SongRow', module);

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <SongRow
        song={new Song()}
        dispatch={() => null}
        onClick={() => console.log('song row')}
        isCurrent={boolean('isCurrent', false)}
        disableAddButton={boolean('disableAddButton', false)}
        disableCovers={boolean('disableCovers', false)}
        slim={boolean('slim', false)}
        style={{}}
      />
    )
  )
