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

const videoExtensions = ['.mp4', '.mkv']
const audioExtensions = ['.mp3']

export const magnetToMedia = async (torrentUrl: string): Promise<Array<Media>> => {
  const client = new Webtorrent()

  return new Promise((resolve): any => {
    console.log('adding: ', torrentUrl)

    client.add(torrentUrl, {
      announce: announceList
    }, (torrent: any) => {
      console.log('files detected: ', torrent.files)
      const files = torrent.files.filter((file: any) => {
        return [...videoExtensions, ...audioExtensions].some((ext) => file.name.endsWith(ext))
      })

      const medias = files.map((file: any) => {
        const type = videoExtensions.some((ext) => file.name.endsWith(ext)) ? 'video' : 'audio'
        return new Media({
          title: file.name,
          artist: {
            name: 'webtorrent',
          },
          album: {
            name: 'webtorrent',
            artist: { name: 'webtorrent' }
          },
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
