// @flow

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import ItunesApiRepository from './ItunesApiRepository'
import Song from '../entities/Song'
import exampleSong from './exampleSong'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /search
// arguments for reply are (status, data, headers)
mock.onGet(/search/).reply(200, {
  results: [
    exampleSong
  ]
})

describe('ItunesApiRepository', () => {
  const itunesRepo = new ItunesApiRepository()

  it('should handle song search', () => {
    expect(itunesRepo.search('Bad brains')).toBeInstanceOf(Promise)
  })

  it('should populate itunes api url from searchTerm', () => {
    expect(itunesRepo.populateUrl('Bad brains')).toBe('https://itunes.apple.com/search?term=Bad%20brains')
  })

  it('search should return an array of songs', () => {
    expect.assertions(1)
    return itunesRepo.search('Bad brains').then((results: Array<Song>) => {
      expect(results.length).toBe(1)
    })
  })

  it('should convert itunes song to entity song', () => {
    expect(itunesRepo.songFromItSong(exampleSong)).toBeInstanceOf(Song)
  })
})
