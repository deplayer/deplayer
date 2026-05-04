/**
 * Fast slug generation - replaces expensive slugify library
 * ~100x faster than @sindresorhus/slugify
 */
function fastSlugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

const zeroPad = (num: number | undefined | null, places: number) =>
  String(num ?? 0).padStart(places, '0')

export function generateArtistId(artistName: string): string {
  const name = artistName ? artistName : 'undefined-artist'
  return fastSlugify(name)
}

export function generateAlbumId(albumName: string, artistName: string): string {
  const name = albumName ? albumName : 'undefined-album'
  const artist = artistName ? artistName : 'undefined-artist'
  return fastSlugify(artist + '-' + name)
}

export function generateMediaId(opts: {
  title: string
  artistName: string
  albumName: string
  track?: number | null
  forcedId?: string | null
  discNumber?: number | null
}): string {
  if (opts.forcedId) {
    return opts.forcedId
  }

  const discNumber = opts.discNumber ? zeroPad(opts.discNumber, 2) : ''
  const raw =
    opts.artistName +
    '_' +
    opts.albumName +
    '_' +
    discNumber +
    '_' +
    zeroPad(opts.track, 4) +
    '_' +
    opts.title

  return fastSlugify(raw)
}
