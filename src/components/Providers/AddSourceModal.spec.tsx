import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AddSourceModal } from './AddSourceModal'

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

  it('renders the picker when open', () => {
    render(<AddSourceModal open configuredKeys={[]} onPick={noop} onClose={noop} />)
    expect(screen.getByTestId('add-source-tile-subsonic')).toBeInTheDocument()
  })

  it('calls onPick then onClose when a tile is clicked', async () => {
    const onPick = vi.fn(); const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddSourceModal open configuredKeys={[]} onPick={onPick} onClose={onClose} />)
    await user.click(screen.getByTestId('add-source-tile-jellyfin'))
    expect(onPick).toHaveBeenCalledWith('jellyfin')
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop fires onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddSourceModal open configuredKeys={[]} onPick={noop} onClose={onClose} />)
    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})
