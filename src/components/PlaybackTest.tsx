import { usePlayback } from '../stores/livestore/hooks'

/**
 * PlaybackTest - Simple component to test usePlayback hook
 * 
 * This component displays the current playback state and provides
 * basic controls for testing. Remove after migration is complete.
 * 
 * To use: Add <PlaybackTest /> somewhere visible in the app.
 */
export function PlaybackTest() {
  const {
    currentTrack,
    currentTrackId,
    isPlaying,
    volume,
    position,
    duration,
    queue,
    queueIndex,
    shuffle,
    repeat,
    play,
    toggle,
    next,
    prev,
    setVolume,
    seek,
    isReady,
  } = usePlayback()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      style={{ 
        position: 'fixed',
        bottom: 80,
        right: 20,
        padding: 16,
        background: '#1a1a2e',
        color: '#eee',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 9999,
        minWidth: 280,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', color: '#7c3aed' }}>
        🎵 Playback Test {isReady ? '✅' : '⏳'}
      </h4>
      
      <div style={{ marginBottom: 8 }}>
        <strong>Track:</strong> {currentTrack?.title || 'None'}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <strong>Artist:</strong> {currentTrack?.artistName || '-'}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <strong>ID:</strong> <span style={{ fontSize: 10, opacity: 0.7 }}>{currentTrackId || '-'}</span>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <strong>Status:</strong> {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <strong>Position:</strong> {formatTime(position)} / {formatTime(duration)}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <strong>Queue:</strong> {queueIndex + 1} of {queue.length}
        {shuffle && ' 🔀'}
        {repeat && ' 🔁'}
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <strong>Volume:</strong> {volume}%
      </div>

      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={position}
        onChange={(e) => seek(Number(e.target.value))}
        style={{ width: '100%', marginBottom: 12 }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button 
          onClick={() => prev()}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          ⏮️
        </button>
        <button 
          onClick={() => toggle()}
          style={{ padding: '6px 16px', cursor: 'pointer', flex: 1 }}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button 
          onClick={() => next()}
          style={{ padding: '6px 12px', cursor: 'pointer' }}
        >
          ⏭️
        </button>
      </div>

      {/* Volume slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🔈</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span>🔊</span>
      </div>

      {/* Play first track button */}
      {queue.length > 0 && !currentTrackId && (
        <button
          onClick={() => play(queue[0])}
          style={{ 
            marginTop: 12, 
            padding: '8px 16px', 
            width: '100%',
            cursor: 'pointer',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          ▶️ Play First Track
        </button>
      )}
    </div>
  )
}

export default PlaybackTest
