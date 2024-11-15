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
  const client = new WebTorrent()
  const [serverInitialized, setServerInitialized] = React.useState(false)

  // if (typeof url !== 'string' || url.length < 10) return

  useRegisterSW({
    onRegistered(r) {
      console.log('SW registered: ', r)

      r?.active && client.createServer({ controller: r })
      setServerInitialized(true)
    }
  })

  function processTorrent(torrent: Torrent, client: any) {
    const file = torrent.files.find((file: any) => {
      return file.type.startsWith('video/')

    }) as any
    if (file === undefined) return () => { }
    if (!serverInitialized) return

    console.log('Video found! torrent file: ', file)

    console.log('streaming file to player', player)
    file.streamTo(player, {
      client: client,
      autoplay: true,
      muted: muted,
      controls: controls
    })
  }

  React.useEffect(() => {
    console.log('loading webtorrent url: ', url)

    console.log('client torrents: ', client.torrents)

    const existingTorrent = client.torrents.find((torrent: Torrent) => {
      console.log('comparing torrent: ', torrent, torrent.magnetURI, url)
      return torrent.magnetURI === url
    })

    console.log('existing torrent: ', existingTorrent)

    if (!existingTorrent) {
      client.add(url, {
        announceList: announceList
      })

      client.on('torrent', (torrent: Torrent) => {
        processTorrent(torrent, client)
      })
    } else {
      processTorrent(existingTorrent, client)
    }

    return () => { }
  }, [url, player])

  console.log('Rendering video element')

  return (
    <video
      ref={player}
      style={style}
      autoPlay={playing}
      controls={false}
      loop={loop}
      muted={muted}
      id='torrent-video-player'
    />
  )
}

export default WebtorrentServer
