import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, number } from '@storybook/addon-knobs'
import withProvider from '../../utils/withProvider'

import Controls from './Controls'

const stories = storiesOf('Controls', module);

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <Controls
        isPlaying={boolean('isPlaying', false)}
        dispatch={() => null}
        playPrev={() => console.log('play prev')}
        playNext={() => console.log('play next')}
        playPause={() => console.log('play play-pause')}
        setVolume={() => console.log('setting volume')}
        volume={number('volume', 10)}
      />
    )
  )
