import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi, expect, afterEach } from 'vitest'
import indexeddb from 'fake-indexeddb'

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

globalThis.indexedDB = indexeddb

const Mock = vi.fn()
vi.stubGlobal('IntersectionObserver', Mock)

// Mock ID3TagService
vi.mock('./services/ID3Tag/ID3TagService', () => {
  return {
    readFileMetadata: vi.fn().mockResolvedValue({
      common: {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: ['Test Genre'],
        track: { no: 1 },
        year: 2024,
        picture: null
      },
      format: {
        duration: 180
      }
    }),
    metadataToSong: vi.fn().mockImplementation((metadata, fileUri, service) => {
      return {
        title: metadata.common.title,
        artist: { name: metadata.common.artist },
        album: {
          name: metadata.common.album,
          artist: { name: metadata.common.artist }
        },
        artistName: metadata.common.artist,
        albumName: metadata.common.album,
        type: fileUri.endsWith('.mp4') ? 'video' : 'audio',
        duration: metadata.format.duration,
        genres: metadata.common.genre,
        track: metadata.common.track.no,
        stream: {
          filesystem: {
            service: service,
            uris: [{ uri: fileUri }]
          }
        }
      }
    })
  }
})

// Mock fflate module
vi.mock('fflate', () => {
  const mockFn = vi.fn()
  return {
    default: {
      unzipSync: mockFn,
      strFromU8: mockFn,
      zlibSync: mockFn,
      gzipSync: mockFn,
      strToU8: mockFn,
      deflateSync: mockFn
    },
    unzipSync: mockFn,
    strFromU8: mockFn,
    zlibSync: mockFn,
    gzipSync: mockFn,
    strToU8: mockFn,
    deflateSync: mockFn
  }
})

// Mock music-metadata module
const mockMetadata = {
  common: {
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: ['Test Genre'],
    track: { no: 1 },
    year: 2024,
    picture: null
  },
  format: {
    duration: 180
  }
}

vi.mock('music-metadata', () => {
  return {
    default: {
      parseBlob: vi.fn().mockResolvedValue(mockMetadata)
    },
    parseBlob: vi.fn().mockResolvedValue(mockMetadata),
    parseBuffer: vi.fn().mockResolvedValue(mockMetadata),
    parseStream: vi.fn().mockResolvedValue(mockMetadata),
    parseFile: vi.fn().mockResolvedValue(mockMetadata),
    orderTags: vi.fn(),
    ratingToStars: vi.fn(),
    selectCover: vi.fn()
  }
}) 
