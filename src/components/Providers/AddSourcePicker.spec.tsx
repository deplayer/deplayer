import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddSourcePicker } from './AddSourcePicker'

const noop = () => {}

describe('AddSourcePicker', () => {
  it('renders one tile per registered provider type', () => {
    render(<AddSourcePicker configuredKeys={[]} onPick={noop} />)
    expect(screen.getAllByTestId(/^add-source-tile-/)).toHaveLength(5)
  })

  it('shows capability chips per tile', () => {
    render(<AddSourcePicker configuredKeys={[]} onPick={noop} />)
    const subsonicTile = screen.getByTestId('add-source-tile-subsonic')
    expect(within(subsonicTile).getByText(/sync/i)).toBeInTheDocument()
    expect(within(subsonicTile).getByText(/search/i)).toBeInTheDocument()
    expect(within(subsonicTile).getByText(/stream/i)).toBeInTheDocument()
  })

  it('disables singleton tiles already configured', () => {
    render(<AddSourcePicker configuredKeys={['itunes']} onPick={noop} />)
    const tile = screen.getByTestId('add-source-tile-itunes')
    expect(tile).toBeDisabled()
    expect(within(tile).getByText(/connected/i)).toBeInTheDocument()
  })

  it('does NOT disable repeatable tiles already configured', () => {
    render(<AddSourcePicker configuredKeys={['subsonic']} onPick={noop} />)
    expect(screen.getByTestId('add-source-tile-subsonic')).toBeEnabled()
  })

  it('calls onPick on tile click', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<AddSourcePicker configuredKeys={[]} onPick={onPick} />)
    await user.click(screen.getByTestId('add-source-tile-jellyfin'))
    expect(onPick).toHaveBeenCalledWith('jellyfin')
  })

  it('does not call onPick when a disabled tile is clicked', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<AddSourcePicker configuredKeys={['itunes']} onPick={onPick} />)
    await user.click(screen.getByTestId('add-source-tile-itunes'))
    expect(onPick).not.toHaveBeenCalled()
  })
})
