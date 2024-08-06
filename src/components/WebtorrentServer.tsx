import React from 'react'
import WebTorrent from 'webtorrent'
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

  // if (typeof url !== 'string' || url.length < 10) return

  useRegisterSW({
    onRegistered(r) {
      r?.active && client.createServer({ controller: r })
    }
  })

  React.useEffect(() => {
    console.log('loading webtorrent url: ', url)

    try {
      client.add(url, {
        announceList: announceList
      })
    } catch (error) {
      console.log('error: ', error)
    }

    client.on('torrent', (torrent: any) => {
      const file = torrent.files.find((file: any) => {
        return file.type.startsWith('video/')
      })

      if (file === undefined) return () => { }

      console.log('file: ', file)

      file.streamTo(player, {
        autoplay: playing,
        muted: muted,
        controls: controls
      })
    })

    return () => { }
  }, [url, player])

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
