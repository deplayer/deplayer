import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useDispatch } from 'react-redux'

import Media from '../../../entities/Media'
import SongRow from './index'
import type { Props } from './index'


const setup = () => {
  const dispatch = useDispatch()

  const props: Props = {
    song: new Media(),
    songsLength: 1,
    queue: {},
    onClick: () => { },
    isCurrent: false,
    style: {},
    dispatch: dispatch,
    disableAddButton: false
  }

  render(<SongRow {...props} />)
}

describe('SongRow', () => {
  it('should show render without errors', () => {
    setup()

    expect(screen.getByRole('row')).toBe(true)
  })
})
