import React from 'react'
import WebTorrent, { Torrent } from 'webtorrent'
import { useRegisterSW } from 'virtual:pwa-register/react'

const announceList = [
  ['wss://tracker.btorrent.xyz'],
  ['udp://tracker.openbittorrent.com:80'],
  ['udp://tracker.internetwarriors.net:1337'],
  ['udp://tracker.leechers-paradise.org:6969'],
  ['udp://tracker.coppersurfer.tk:6969'],
  ['udp://exodus.desync.com:6969'],
  ['wss://tracker.openwebtorrent.com'],
]

function WebtorrentServer({ url, playing, muted, controls, player, style, loop }: { url: string, muted: boolean, playing: boolean, controls: boolean, player: any, style: any, loop: boolean }) {
  const [client] = React.useState(() => new WebTorrent())
  const [serverInitialized, setServerInitialized] = React.useState(false)
  const [currentTorrent, setCurrentTorrent] = React.useState<Torrent | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  // Register service worker and initialize server
  useRegisterSW({
    onRegistered(r) {
      console.log('SW registered: ', r)
      if (r?.active) {
        client.createServer({ controller: r })
        setServerInitialized(true)
        console.log('WebTorrent server initialized successfully')
      }
    }
  })

  // Handle torrent streaming
  const processTorrent = React.useCallback((torrent: Torrent) => {
    if (!serverInitialized) {
      console.log('Server not initialized yet, waiting...')
      return
    }

    if (!videoRef.current) {
      console.log('Video element not ready yet')
      return
    }

    console.log('Processing torrent:', torrent)
    console.log('Available files:', torrent.files.map(f => ({ name: f.name, type: (f as any).type })))

    const file = torrent.files.find((file: any) => (file as any).type?.startsWith('video/'))
    if (!file) {
      console.log('No video file found in torrent')
      return
    }

    console.log('Found video file:', { name: file.name, type: (file as any).type, size: file.length })
    try {
      // Use streamTo for direct streaming to video element
      if (videoRef.current) {
        const streamUrl = file.streamURL
        console.log('Streaming to video element', streamUrl)
        videoRef.current.src = streamUrl
        videoRef.current.play()
      }

      // Monitor torrent progress
      torrent.on('download', () => {
        console.log('Download progress:', {
          progress: torrent.progress,
          downloaded: torrent.downloaded,
          downloadSpeed: torrent.downloadSpeed
        })
      })

      // Add file-specific error handling
      file.on('error', (err: Error) => {
        console.error('File streaming error:', err)
      })

    } catch (err) {
      console.error('Error streaming torrent:', err)
    }
  }, [serverInitialized])

  // Handle torrent loading
  React.useEffect(() => {
    if (!serverInitialized) {
      console.log('Server not initialized yet, waiting to load torrent')
      return
    }

    console.log('Loading torrent:', url)
    
    // Check for existing torrent
    const existing = client.torrents.find(t => t.magnetURI === url)
    if (existing) {
      console.log('Using existing torrent')
      setCurrentTorrent(existing)
      processTorrent(existing)
      return
    }

    // Add new torrent
    try {
      client.add(url, { announceList }, (torrent) => {
        console.log('Torrent added successfully:', {
          infoHash: torrent.infoHash,
          name: torrent.name,
          files: torrent.files.map(f => f.name)
        })
        setCurrentTorrent(torrent)
        processTorrent(torrent)
      })
    } catch (err) {
      console.error('Error adding torrent:', err)
    }

    // Cleanup
    return () => {
      if (currentTorrent) {
        console.log('Removing torrent')
        currentTorrent.destroy()
      }
    }
  }, [url, serverInitialized, client, processTorrent])

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
        if (typeof player === 'function') {
          player(el)
        }
      }}
      style={defaultStyle}
      autoPlay={playing}
      controls={controls}
      loop={loop}
      muted={muted}
      playsInline
      id='torrent-video-player'
      onError={(e) => {
        console.error('Video error:', e.currentTarget.error)
        const error = e.currentTarget.error
        if (error) {
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
        }
      }}
      onLoadStart={() => console.log('Video loadStart')}
      onLoadedMetadata={() => console.log('Video loadedMetadata')}
      onLoadedData={() => console.log('Video loadedData')}
      onCanPlay={() => console.log('Video canPlay')}
      onPlaying={() => console.log('Video playing')}
    />
  )
}

export default WebtorrentServer
