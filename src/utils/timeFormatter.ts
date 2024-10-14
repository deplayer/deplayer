export const getDurationStr = (duration?: number) => {
  if (!duration) {
    return '00:00'
  }

  const secondsNum = (duration / 1000) % 60
  const minutesNum = (duration / (1000 * 60)) % 60
  const seconds = ('0' + parseInt(secondsNum.toString(), 10)).slice(-2)
  const minutes = ('0' + parseInt(minutesNum.toString(), 10)).slice(-2)

  return (minutes + ':' + seconds).replace(/^(0+:?)/, '')
}

