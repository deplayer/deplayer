import Webtorrent from 'webtorrent'

import Media from '../../entities/Media'

const announceList = [
  ['udp://tracker.openbittorrent.com:80'],
  ['udp://tracker.internetwarriors.net:1337'],
  ['udp://tracker.leechers-paradise.org:6969'],
  ['udp://tracker.coppersurfer.tk:6969'],
  ['udp://exodus.desync.com:6969'],
  ['wss://tracker.webtorrent.io'],
  ['wss://tracker.btorrent.xyz'],
  ['wss://tracker.openwebtorrent.com'],
  ['wss://tracker.fastcast.nz']
]

export const magnetToMedia = async (torrentUrl: string): Promise<Array<Media>> => {
  const client = new Webtorrent()

  return new Promise((resolve): any => {
    console.log('adding: ', torrentUrl)
    client.add(torrentUrl, {
      announce: announceList
    }, (torrent: any) => {
      console.log('files detected: ', torrent.files)
      const files = torrent.files.filter((file: any) => {
        return file.name.endsWith('.mp4') || file.name.endsWith('.mp3')
      })

      const medias = files.map((file: any) => {
        return new Media({
          title: file.name,
          artistName: 'webtorrent',
          albumName: 'webtorrent',
          stream: [
            {
              service: 'webtorrent',
              uris: [
                {
                  uri: torrentUrl,
                  quality: 'unknown'
                }
              ]
            }
          ]
        })
      })

      return resolve(medias)
    })
  })
}
