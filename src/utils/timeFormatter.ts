// Formats milliseconds as m:ss, or h:mm:ss for an hour or longer.
export const getDurationStr = (duration?: number) => {
  const totalSeconds = Math.max(0, Math.floor((duration || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`
}
