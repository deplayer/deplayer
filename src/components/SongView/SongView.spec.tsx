import * as React from 'react'
import { shallow } from 'enzyme'
import configureEnzyme from '../../tests/configureEnzyme'
import SongView from './SongView'
import Song from '../../entities/Song'

configureEnzyme()

const setup = (customProps: any) => {
  const defaultProps = {
    song: new Song(),
    match: {
      params: {}
    },
    collection: {
      rows: {}
    },
    queue: {
      currentPlaying: null
    }
  }

  const props = {...defaultProps, ...customProps}

  const enzymeWrapper = shallow(<SongView {...props}/>)

  return {
    props,
    enzymeWrapper,
  }
}

describe('SongView', () => {
  it('redirect if no song found', () => {
    const { enzymeWrapper } = setup({})
    expect(enzymeWrapper.find('Redirect').exists()).toBe(true)
  })

  it('render song without crash', () => {
    const song = new Song()
    const collection = { rows: {} }
    collection.rows[song.id] = song
    const { enzymeWrapper } = setup({
      song,
      collection,
      match: {
        params: {
          id: song.id
        }
      }
    })
    expect(enzymeWrapper.find('.song-view').exists()).toBe(true)
  })
})
