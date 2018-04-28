export const isTrack = (file) => {
  return file.match(/^.*\.[wav|ogg|mp3]$/)
}
