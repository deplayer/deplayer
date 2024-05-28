import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { connect } from 'react-redux'

import Media from '../../../entities/Media'
import SongRow from './index'
import type { Props } from './index'


const setup = () => {
  const props: Props = {
    song: new Media(),
    songsLength: 1,
    queue: {},
    onClick: () => { },
    isCurrent: false,
    style: {},
    disableAddButton: false
  }

  const containedComponent = connect((state: any) => ({ ...state, ...props }))(SongRow)

  render(
    containedComponent
  )
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    setup()

    expect(screen.getByRole('row')).toBe(true)
  })
})
