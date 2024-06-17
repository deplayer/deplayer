let wakeLockController: AbortController | null = null

export const requestWakeLock = async () => {
  if ('WakeLock' in window && 'request' in window.WakeLock) {

    const controller = new AbortController()
    const signal = controller.signal
    window.WakeLock.request('screen', { signal })
      .catch((e) => {
        if (e.name === 'AbortError') {
          console.log('Wake Lock was aborted')
        } else {
          console.error(`${e.name}, ${e.message}`)
        }
      })
    console.log('Wake Lock is active')
    wakeLockController = controller

  } else if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
    let wakeLock = null

    try {
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener('release', (e) => {
        console.log(e)
        console.log('Wake Lock was released')
      })
      console.log('Wake Lock is active')
    } catch (e: any) {
      console.error(`${e.name}, ${e.message}`)
    }
  } else {
    console.error('Wake Lock API not supported.')
  }
}

export const releaseWakeLock = () => {
  if (wakeLockController) {
    if (wakeLockController.abort) {
      wakeLockController.abort()
    }

    if (wakeLockController.release) {
      wakeLockController.release()
    }

    wakeLockController = null
  }
}
