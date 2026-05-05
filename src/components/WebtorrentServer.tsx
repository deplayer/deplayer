import React from 'react'
import { Torrent } from 'webtorrent'
import { useRegisterSW } from 'virtual:pwa-register/react'
import WebtorrentService from '../services/WebtorrentService'

const announceList = [
  ['wss://tracker.btorrent.xyz'],
  ['udp://tracker.openbittorrent.com:80'],
  ['udp://tracker.internetwarriors.net:1337'],
  ['udp://tracker.leechers-paradise.org:6969'],
  ['udp://tracker.coppersurfer.tk:6969'],
  ['udp://exodus.desync.com:6969'],
  ['wss://tracker.openwebtorrent.com'],
]

interface WebtorrentServerProps {
  url: string;
  playing?: boolean;
  muted?: boolean;
  controls?: boolean;
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
  style?: React.CSSProperties;
  player?: (player: HTMLVideoElement) => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffer?: () => void;
  onBufferEnd?: () => void;
  onError?: (error: Error) => void;
  seek?: number;
  onEnded?: () => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onSeek?: (seconds: number) => void;
}

function WebtorrentServer({
  url,
  playing = false,
  muted = false,
  controls = false,
  volume = 1,
  playbackRate = 1,
  loop = false,
  style = {},
  player,
  onReady,
  onPlay,
  onPause,
  onBuffer,
  onBufferEnd,
  onError,
  onEnded,
  onProgress,
  onDuration,
  onSeek,
}: WebtorrentServerProps) {
  const webtorrentService = WebtorrentService.getInstance()
  const client = webtorrentService.getClient()
  const [currentTorrent, setCurrentTorrent] = React.useState<Torrent | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const progressInterval = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Register service worker and initialize server
  useRegisterSW({
    onRegistered(r) {
      console.log('SW registered: ', r)
      webtorrentService.initializeServer(r as ServiceWorkerRegistration)
    }
  })

  // Handle progress tracking
  React.useEffect(() => {
    if (!videoRef.current || !onProgress) return

    const handleProgress = () => {
      if (!videoRef.current) return
      const duration = videoRef.current.duration
      const currentTime = videoRef.current.currentTime
      const buffered = videoRef.current.buffered
      
      const played = currentTime / duration
      const playedSeconds = currentTime
      
      const loaded = buffered.length ? buffered.end(buffered.length - 1) / duration : 0
      const loadedSeconds = buffered.length ? buffered.end(buffered.length - 1) : 0

      onProgress({
        played,
        playedSeconds,
        loaded,
        loadedSeconds
      })
    }

    progressInterval.current = setInterval(handleProgress, 1000)
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [onProgress])

  // Handle play/pause
  React.useEffect(() => {
    if (!videoRef.current) return
    
    if (playing) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error attempting to play:', error)
          onError?.(error)
        })
      }
    } else {
      videoRef.current.pause()
    }
  }, [playing, onError])

  // Handle volume changes
  React.useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.volume = volume
  }, [volume])

  // Handle playback rate
  React.useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = playbackRate
  }, [playbackRate])

  // Handle torrent streaming
  const processTorrent = React.useCallback((torrent: Torrent) => {
    if (!webtorrentService.isServerInitialized()) {
      console.log('Server not initialized yet, waiting...')
      return
    }

    if (!videoRef.current) {
      console.log('Video element not ready yet')
      return
    }

    const file = torrent.files.find((file) => (file as unknown as Record<string, unknown>).type?.toString()?.startsWith('video/'))
    if (!file) {
      const error = new Error('No video file found in torrent')
      console.error(error)
      onError?.(error)
      return
    }

    try {
      if (videoRef.current) {
        (file as unknown as { streamTo: (el: HTMLVideoElement) => { on: (event: string, cb: (err?: Error) => void) => ReturnType<typeof Object.create> } }).streamTo(videoRef.current)
          .on('ready', () => {
            console.log('Stream is ready')
            onReady?.()
          })
          .on('error', (err: Error) => {
            console.error('Stream error:', err)
            onError?.(err)
          })
      }

      torrent.on('download', () => {
        if (!videoRef.current) return
        const buffered = videoRef.current.buffered
        if (buffered.length) {
          const loaded = buffered.end(buffered.length - 1) / videoRef.current.duration
          if (loaded > 0.1) {
            onBufferEnd?.()
          }
        }
      })

      file.on('error', (err: Error) => {
        console.error('File streaming error:', err)
        onError?.(err)
      })

    } catch (err) {
      console.error('Error streaming torrent:', err)
      onError?.(err as Error)
    }
  }, [onReady, onError, onBufferEnd])

  // Handle torrent loading
  React.useEffect(() => {
    if (!client) {
      console.log('Server not initialized yet, waiting to load torrent')
      return
    }

    const existing = client.torrents.find((t: Torrent) => t.magnetURI === url)
    if (existing) {
      console.log('Using existing torrent')
      setCurrentTorrent(existing)
      processTorrent(existing)
      return
    }

    try {
      client.add(url, { announceList }, (torrent: Torrent) => {
        console.log('Torrent added successfully')
        setCurrentTorrent(torrent)
        processTorrent(torrent)
      })
    } catch (err) {
      console.error('Error adding torrent:', err)
      onError?.(err as Error)
    }

    return () => {
      if (currentTorrent) {
        console.log('Removing torrent')
        currentTorrent.destroy()
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [url, client, processTorrent, onError])

  const defaultStyle = {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    ...style
  }

  return (
    <video
      ref={(el) => {
        videoRef.current = el
        if (typeof player === 'function' && el) {
          player(el)
        }
      }}
      style={defaultStyle}
      controls={controls}
      loop={loop}
      muted={muted}
      playsInline
      id='torrent-video-player'
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onLoadStart={onBuffer}
      onWaiting={onBuffer}
      onPlaying={onBufferEnd}
      onDurationChange={(e) => onDuration?.(e.currentTarget.duration)}
      onSeeked={(e) => onSeek?.(e.currentTarget.currentTime)}
      onError={(e) => {
        console.error('Video error:', e.currentTarget.error)
        const error = e.currentTarget.error
        if (error) {
          onError?.(new Error(`Video error: ${error.message}`))
        }
      }}
    />
  )
}

export default WebtorrentServer
