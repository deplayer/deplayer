import Webtorrent from 'webtorrent'

import Media from '../../entities/Media'

export const magnetToMedia = async (torrentUrl: string): Promise<Array<Media>> => {
  const client = new Webtorrent()

  return new Promise((resolve): any => {
    client.add(torrentUrl, (torrent: any) => {
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
