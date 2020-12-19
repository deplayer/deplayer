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

export const magnetToMedia = async (torrentUrl: string|File): Promise<Array<Media>> => {
  const client = new Webtorrent()

  return new Promise((resolve): any => {
    console.log('adding: ', torrentUrl)
    client.add(torrentUrl, {
      announce: announceList
    }, (torrent: any) => {
      console.log('files detected: ', torrent.files)
      const files = torrent.files.filter((file: any) => {
        console.log(`scanning ${file.name}`)
        return file.name.endsWith('.mp4') || file.name.endsWith('.mp3') || file.name.endsWith('.mkv')
      })

      const medias = files.map((file: any) => {
        const type = file.name.endsWith('.mp4') || file.name.endsWith('.mkv') ? 'video': 'audio'
        const attachments = {
          'webtorrent': {
            content_type: 'application/x-bittorrent',
            data: typeof torrentUrl === 'string' ? btoa(torrentUrl): torrentUrl
          }
        }

        return new Media({
          title: file.name,
          artistName: 'webtorrent',
          albumName: 'webtorrent',
          type: type,
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
          ],
          _attachments: attachments
        })
      })

      return resolve(medias)
    })
  })
}
