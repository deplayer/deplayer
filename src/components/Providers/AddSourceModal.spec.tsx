import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddSourceModal } from './AddSourceModal'

// Ensure the portal target exists.
beforeAll(() => {
  const root = document.createElement('div')
  root.id = 'modal-root'
  document.body.appendChild(root)
})

const noop = () => {}

describe('AddSourceModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <AddSourceModal open={false} configuredKeys={[]} onPick={noop} onClose={noop} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one tile per registered provider type (inline variant)', () => {
    render(
      <AddSourceModal open variant="inline" configuredKeys={[]} onPick={noop} onClose={noop} />,
    )
    // Five tiles: subsonic, mstream, itunes, jellyfin, musicbrainz
    expect(screen.getAllByTestId(/^add-source-tile-/)).toHaveLength(5)
  })

  it('shows capability chips per tile', () => {
    render(
      <AddSourceModal open variant="inline" configuredKeys={[]} onPick={noop} onClose={noop} />,
    )
    const subsonicTile = screen.getByTestId('add-source-tile-subsonic')
    expect(within(subsonicTile).getByText(/sync/i)).toBeInTheDocument()
    expect(within(subsonicTile).getByText(/search/i)).toBeInTheDocument()
    expect(within(subsonicTile).getByText(/stream/i)).toBeInTheDocument()
  })

  it('disables singleton tiles already configured', () => {
    render(
      <AddSourceModal open variant="inline" configuredKeys={['itunes']} onPick={noop} onClose={noop} />,
    )
    const tile = screen.getByTestId('add-source-tile-itunes')
    expect(tile).toBeDisabled()
    expect(within(tile).getByText(/connected/i)).toBeInTheDocument()
  })

  it('does NOT disable repeatable tiles already configured', () => {
    render(
      <AddSourceModal open variant="inline" configuredKeys={['subsonic']} onPick={noop} onClose={noop} />,
    )
    expect(screen.getByTestId('add-source-tile-subsonic')).toBeEnabled()
  })

  it('calls onPick then onClose when a tile is clicked', async () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <AddSourceModal open variant="inline" configuredKeys={[]} onPick={onPick} onClose={onClose} />,
    )
    await user.click(screen.getByTestId('add-source-tile-jellyfin'))
    expect(onPick).toHaveBeenCalledWith('jellyfin')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onPick when a disabled tile is clicked', async () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <AddSourceModal open variant="inline" configuredKeys={['itunes']} onPick={onPick} onClose={onClose} />,
    )
    await user.click(screen.getByTestId('add-source-tile-itunes'))
    expect(onPick).not.toHaveBeenCalled()
  })
})
