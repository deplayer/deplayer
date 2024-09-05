import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'

import MusicTable, { Props } from './MusicTable'

const setup = () => {
  const props: Props = {
    app: {
      backgroundImage: '',
      loading: false,
      sidebarToggled: false,
      showVisuals: false,
      showSpectrum: false,
      mqlMatch: false,
      heightMqlMatch: false,
      displayMiniQueue: false,
      version: '',
      showAddMediaModal: false
    },
    error: 'test',
    dispatch: (value) => value,
    tableIds: [],
    queue: {
      trackIds: [],
      currentPlaying: {},
    },
    collection: {}
  }

  render(<MusicTable {...props} />, { wrapper: Router })
}

describe('MusicTable', () => {
  it('Should show errors', () => {
    setup()
    expect(screen.findByRole('music-table')).toBeTruthy()
  })
})
