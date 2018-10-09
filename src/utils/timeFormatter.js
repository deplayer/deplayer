export const getDurationStr = (duration) => {
  const seconds = ('0' + parseInt((duration / 1000) % 60, 10)).slice(-2)
  const minutes = ('0' + parseInt((duration / (1000 * 60)) % 60, 10)).slice(-2)

  return (minutes + ':' + seconds).replace(/^(0+:?)/, '')
}

