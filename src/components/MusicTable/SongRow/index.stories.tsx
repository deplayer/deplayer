import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import SongRow from './index'
import exampleSong from '../../../utils/exampleSong'
import withProvider from '../../../utils/withProvider'

const stories = storiesOf('SongRow', module)

stories
  .addDecorator(withKnobs)
  .addDecorator(withProvider)
  .add(
    'default',
    () => (
      <div className='bg-blue-900'>
        <SongRow
          song={exampleSong}
          dispatch={() => console.log('dispatch')}
          onClick={() => console.log('song row')}
          isCurrent={boolean('isCurrent', false)}
          disableAddButton={boolean('disableAddButton', false)}
          disableCovers={boolean('disableCovers', false)}
          slim={boolean('slim', false)}
          style={{}}
        />
      </div>
    )
  )
