import { screen, render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ArtistView from './index'
import Artist from '../../entities/Artist'

const setup = (customProps: any) => {
  const defaultProps = {
    collection: {},
    artist: new Artist({ name: 'foo' }),
    artistMetadata: {},
    dispatch: () => { },
    songsByAlbum: {},
    albumsByArtist: [],
    albums: [],
    songs: []
  }

  const props = { ...defaultProps, ...customProps }

  render(<ArtistView {...props} />)
}

describe('ArtisView', () => {
  it('render song without crash', () => {
    setup({})
    expect(screen.getByTestId('artist-view')).toBeTruthy()
  })
})
