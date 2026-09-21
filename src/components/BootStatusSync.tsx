import React from 'react'
import { useMediaCount } from '../stores/livestore/hooks'
import { useUIStore } from '../stores/uiStore'

/**
 * Single writer of `uiStore.bootStatus`.
 *
 * Mounted only once LiveStore exists (see `App`), because it subscribes to the
 * live media count: a boot-time snapshot would leave a library that fills
 * after boot (a first sync) stuck on `empty`.
 */
export const BootStatusSync = () => {
  const mediaCount = useMediaCount()
  const setBootStatus = useUIStore((s) => s.setBootStatus)

  React.useEffect(() => {
    // The count query reports `undefined` until its first result; hold
    // `booting` until a real number arrives so the UI never flashes empty.
    if (typeof mediaCount !== 'number') return
    setBootStatus(mediaCount > 0 ? 'ready' : 'empty')
  }, [mediaCount, setBootStatus])

  return null
}
