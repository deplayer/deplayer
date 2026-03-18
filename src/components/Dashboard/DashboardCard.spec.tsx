import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardCard from './DashboardCard'

describe('DashboardCard', () => {
  it('should render title and children', () => {
    render(
      <MemoryRouter>
        <DashboardCard title="Test Card" icon="faMusic">
          <p data-testid="card-content">Hello</p>
        </DashboardCard>
      </MemoryRouter>
    )
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
  })

  it('should render see all link when provided', () => {
    render(
      <MemoryRouter>
        <DashboardCard title="Test" icon="faMusic" seeAllLink="/collection">
          <p>Content</p>
        </DashboardCard>
      </MemoryRouter>
    )
    expect(screen.getByTestId('see-all-link')).toBeInTheDocument()
  })
})
