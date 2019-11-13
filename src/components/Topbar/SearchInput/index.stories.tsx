import * as React from 'react'
import { storiesOf } from '@storybook/react'
import SearchInput from './index'

const stories = storiesOf('SearchInput', module);

stories
  .add(
    'default',
    () => (
      <SearchInput
        ref={React.createRef()}
        loading={false}
        searchToggled={true}
        onFocus={() => console.log('on focus')}
        onSearchChange={() => console.log('on setSearchChange')}
        onBlur={() => console.log('on onBlur')}
        value={'some value'}
      />
    )
  )
