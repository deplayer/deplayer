export const isTrack = (file: string) => {
  const results = file.match(/^.*.[wav|ogg|mp3]$/)
  if (results && results.length) {
    return true
  }

  return false
}
