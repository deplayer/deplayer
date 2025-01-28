import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi, expect, afterEach } from 'vitest'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Runs a cleanup after each test case
afterEach(() => {
  cleanup()
}) 
