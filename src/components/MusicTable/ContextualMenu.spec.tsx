import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import ContextualMenu from './ContextualMenu'
import Media, { IMedia } from '../../entities/Media'
import { defaultState as queueDefaultState, State as QueueState } from '../../reducers/queue'

describe('ContextualMenu', () => {
  const mockSong = new Media({
    id: 'test-song-1',
    title: 'Test Song',
    artist: { name: 'Test Artist' },
    artistName: 'Test Artist',
    artistId: 'test-artist-1',
    type: 'audio',
    album: { id: 'test-album-1', name: 'Test Album', artist: { name: 'Test Artist' } },
    albumName: 'Test Album',
    cover: { thumbnailUrl: 'test-cover.jpg', fullUrl: 'test-cover.jpg' },
    stream: { url: { service: 'test', uris: [{ uri: 'test-stream.mp3' }] } },
    duration: 180000,
    playCount: 0,
    genres: ['test']
  } as IMedia)

  const mockStore = createStore((state: { queue: QueueState } = {
    queue: {
      trackIds: [mockSong.id],
      randomTrackIds: [],
      currentPlaying: mockSong.id,
      repeat: false,
      shuffle: false,
      nextSongId: null,
      prevSongId: null
    }
  }) => state)

  const setup = (props = {}) => {
    const onClick = vi.fn()
    const dispatch = vi.fn()

    const utils = render(
      <Provider store={mockStore}>
        <ContextualMenu
          song={mockSong}
          onClick={onClick}
          dispatch={dispatch}
          queue={mockStore.getState().queue}
          {...props}
        />
      </Provider>
    )

    return {
      onClick,
      dispatch,
      ...utils,
    }
  }

  it('should open menu when clicking the trigger button', () => {
    const { getByRole } = setup()
    
    // Click the menu trigger
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    
    // Menu should be visible
    expect(screen.getByText('play')).toBeInTheDocument()
  })

  it('should show remove button when song is in queue', () => {
    const { getByRole } = setup()
    
    // Click the menu trigger
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    
    // Remove button should be visible
    expect(screen.getByText('remove')).toBeInTheDocument()
  })

  it('should dispatch REMOVE_FROM_QUEUE action when clicking remove button', () => {
    const { dispatch } = setup()
    
    // Click the menu trigger
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    
    // Click the remove button
    fireEvent.click(screen.getByText('remove'))
    
    // Check if correct action was dispatched
    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_FROM_QUEUE',
      data: [mockSong]
    })
  })

  it('should not trigger onClick when clicking remove button', () => {
    const { onClick } = setup()
    
    // Click the menu trigger
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    
    // Click the remove button
    fireEvent.click(screen.getByText('remove'))
    
    // onClick should not have been called
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should close menu after clicking remove button', () => {
    const { getByRole } = setup()
    
    // Click the menu trigger
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    
    // Click the remove button
    fireEvent.click(screen.getByText('remove'))
    
    // Menu should be closed
    expect(screen.queryByText('remove')).not.toBeInTheDocument()
  })
}) 