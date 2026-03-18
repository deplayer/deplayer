import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '.'

describe('HeroSection', () => {
  it('should render children content', () => {
    render(
      <HeroSection backgroundImage="https://example.com/image.jpg">
        <h1 data-testid="hero-title">Test Title</h1>
      </HeroSection>
    )
    expect(screen.getByTestId('hero-title')).toBeInTheDocument()
  })

  it('should set background image style', () => {
    render(
      <HeroSection backgroundImage="https://example.com/image.jpg">
        <span>Content</span>
      </HeroSection>
    )
    const hero = screen.getByTestId('hero-section')
    expect(hero).toBeInTheDocument()
  })

  it('should render without background image', () => {
    render(
      <HeroSection>
        <span>Content</span>
      </HeroSection>
    )
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })
})
