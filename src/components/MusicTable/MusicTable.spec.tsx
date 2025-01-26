import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { State as QueueState } from '../../reducers/queue'
import { State as CollectionState } from '../../reducers/collection'
import MusicTable, { Props } from './MusicTable'

const setup = () => {
  const props: Props = {
    app: {
      ready: false,
      backgroundImage: "",
      loading: false,
      sidebarToggled: false,
      showVisuals: false,
      showSpectrum: false,
      mqlMatch: false,
      heightMqlMatch: false,
      displayMiniQueue: false,
      showAddMediaModal: false,
      rightPanelToggled: false
    },
    error: 'test',
    dispatch: (value) => value,
    tableIds: [],
    queue: {
      trackIds: [],
      currentPlaying: null
    } as unknown as QueueState,
    collection: {
      rows: {},
      albums: {},
      artists: {},
      songsByArtist: {},
      songsByAlbum: {},
      albumsByArtist: {},
      covers: {},
      artistCovers: {},
      albumCovers: {},
      loading: false,
      error: null,
      lastUpdate: null,
      lastScan: null,
      scanInProgress: false,
      scanErrors: [],
      scanProgress: 0
    } as unknown as CollectionState
  } 

  render(<MusicTable {...props} />, { wrapper: Router })
}

describe('MusicTable', () => {
  it('Should show errors', () => {
    setup()
    expect(screen.findByRole('music-table')).toBeTruthy()
  })
})
