import { getStreamUri } from './StreamUriService'
import Media from '../../entities/Media'

const prepareData = (streams: Array<any>) => {
  const settings = {
    app: {
      ipfs: {
        port: 0,
        host: '',
        proto: ''
      }
    }
  }

  const song = new Media({
    forcedId: 'foo',
    stream: streams
  })
  return getStreamUri(song, settings, 0)
}

describe('getStreamUri', () => {
  it('should return streamUrl', () => {
    const streamUrl = 'https://foo.bar'
    const streams = [
      {
        service: 'subsonic',
        uris: [{uri: streamUrl}]
      }
    ]

    const streamUri = prepareData(streams)
    expect(streamUri).toBe(streamUrl)
  })
})
