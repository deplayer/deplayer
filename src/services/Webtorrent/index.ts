import Webtorrent from 'webtorrent'

import Media from '../../entities/Media'

const announceList = [
  'wss://tracker.btorrent.xyz',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.internetwarriors.net:1337',
  'udp://tracker.leechers-paradise.org:6969',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://exodus.desync.com:6969',
  'wss://tracker.openwebtorrent.com',
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
        return file.name.endsWith('.mp4') || file.name.endsWith('.mp3') || file.name.endsWith('.mkv')
      })

      const medias = files.map((file: any) => {
        const type = file.name.endsWith('.mp4') ? 'video' : 'audio'
        return new Media({
          title: file.name,
          artistName: 'webtorrent',
          albumName: 'webtorrent',
          type: type,
          stream: {
            webtorrent: {
              service: 'webtorrent',
              uris: [
                {
                  uri: torrentUrl
                }
              ]
            }
          }
        })
      })

      return resolve(medias)
    })
  })
}
