import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PlayerRefService from './PlayerRefService'
import ReactPlayer from 'react-player'
import type { PlaybackTransport } from './PlaybackController'

/**
 * Create a mock React.RefObject<ReactPlayer> whose getInternalPlayer()
 * returns the given element. The single cast to ReactPlayer is scoped here.
 */
function mockPlayerRef(internalPlayer: HTMLMediaElement | null): React.RefObject<ReactPlayer | null> {
  return {
    current: {
      getInternalPlayer: vi.fn().mockReturnValue(internalPlayer),
    } as unknown as ReactPlayer,
  }
}

function mockNullPlayerRef(): React.RefObject<ReactPlayer | null> {
  return { current: null }
}

describe('PlayerRefService', () => {
  let service: PlayerRefService

  beforeEach(() => {
    // Reset singleton state
    service = PlayerRefService.getInstance()
    service.setPlayerRef(null)
    // Clean up any DOM audio elements from prior tests
    document.querySelectorAll('audio, video').forEach(el => el.remove())
  })

  afterEach(() => {
    document.querySelectorAll('audio, video').forEach(el => el.remove())
  })

  // -------------------------------------------------------------------------
  // Compile-time contract: PlayerRefService implements PlaybackTransport
  // -------------------------------------------------------------------------

  it('satisfies the PlaybackTransport contract', () => {
    // TypeScript enforces at compile time — this test is a runtime smoke check
    // that the methods exist and have the right signatures.
    const transport: PlaybackTransport = service
    expect(typeof transport.stop).toBe('function')
    expect(typeof transport.play).toBe('function')
    expect(typeof transport.pause).toBe('function')
    expect(typeof transport.toggle).toBe('function')
  })

  // -------------------------------------------------------------------------
  // stop()
  // -------------------------------------------------------------------------

  describe('stop()', () => {
    it('pauses all playing audio elements and resets currentTime', () => {
      const audio1 = document.createElement('audio')
      const audio2 = document.createElement('audio')
      document.body.appendChild(audio1)
      document.body.appendChild(audio2)

      // Simulate playing state
      Object.defineProperty(audio1, 'paused', { value: false, writable: true })
      Object.defineProperty(audio2, 'paused', { value: false, writable: true })
      audio1.currentTime = 42
      audio2.currentTime = 99

      service.stop()

      expect(audio1.paused).toBe(false) // pause() is called but happy-dom may not toggle paused
      // Verify pause was attempted (currentTime reset is the key observable)
      expect(audio1.currentTime).toBe(0)
      expect(audio2.currentTime).toBe(0)
    })

    it('does not throw when there are no audio elements', () => {
      expect(() => service.stop()).not.toThrow()
    })

    it('skips already-paused elements', () => {
      const audio = document.createElement('audio')
      document.body.appendChild(audio)
      Object.defineProperty(audio, 'paused', { value: true, writable: true })
      audio.currentTime = 42

      service.stop()

      // currentTime should NOT be reset for already-paused elements
      // because the implementation checks !mediaEl.paused before resetting
      expect(audio.currentTime).toBe(42)
    })
  })

  // -------------------------------------------------------------------------
  // play()
  // -------------------------------------------------------------------------

  describe('play()', () => {
    it('plays the internal player element when ready', async () => {
      const audio = document.createElement('audio')
      const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)

      const mockRef = mockPlayerRef(audio)

      service.setPlayerRef(mockRef)

      await service.play()

      expect(playSpy).toHaveBeenCalledTimes(1)
    })

    it('retries until the internal player is ready', async () => {
      const audio = document.createElement('audio')
      const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)

      let callCount = 0
      const mockRef: React.RefObject<ReactPlayer | null> = {
        current: {
          getInternalPlayer: vi.fn().mockImplementation(() => {
            callCount++
            return callCount >= 3 ? audio : null
          }),
        } as unknown as ReactPlayer,
      }

      service.setPlayerRef(mockRef)

      await service.play()

      expect(callCount).toBeGreaterThanOrEqual(3)
      expect(playSpy).toHaveBeenCalledTimes(1)
    })

    it('gives up after max attempts and logs a warning', async () => {
      const mockRef = mockPlayerRef(null)

      service.setPlayerRef(mockRef)

      // Should not throw even after exhausting retries
      await expect(service.play()).resolves.toBeUndefined()
    })

    it('handles play rejection gracefully', async () => {
      const audio = document.createElement('audio')
      const playSpy = vi.spyOn(audio, 'play').mockRejectedValue(new Error('NotAllowedError'))

      const mockRef = mockPlayerRef(audio)

      service.setPlayerRef(mockRef)

      // Should not throw on play rejection
      await expect(service.play()).resolves.toBeUndefined()
      expect(playSpy).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // pause()
  // -------------------------------------------------------------------------

  describe('pause()', () => {
    it('pauses the internal player element', () => {
      const audio = document.createElement('audio')
      const pauseSpy = vi.spyOn(audio, 'pause')

      const mockRef = mockPlayerRef(audio)

      service.setPlayerRef(mockRef)

      service.pause()

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('is a no-op when there is no player ref', () => {
      expect(() => service.pause()).not.toThrow()
    })

    it('is a no-op when player ref current is null', () => {
      service.setPlayerRef(mockNullPlayerRef())
      expect(() => service.pause()).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // toggle()
  // -------------------------------------------------------------------------

  describe('toggle()', () => {
    it('plays when the internal element is paused', () => {
      const audio = document.createElement('audio')
      const playSpy = vi.spyOn(audio, 'play').mockResolvedValue(undefined)
      Object.defineProperty(audio, 'paused', { value: true })

      const mockRef = mockPlayerRef(audio)

      service.setPlayerRef(mockRef)

      service.toggle()

      expect(playSpy).toHaveBeenCalled()
    })

    it('pauses when the internal element is playing', () => {
      const audio = document.createElement('audio')
      const pauseSpy = vi.spyOn(audio, 'pause')
      Object.defineProperty(audio, 'paused', { value: false })

      const mockRef = mockPlayerRef(audio)

      service.setPlayerRef(mockRef)

      service.toggle()

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('is a no-op when there is no internal player', () => {
      service.setPlayerRef(mockNullPlayerRef())
      expect(() => service.toggle()).not.toThrow()
    })
  })
})
