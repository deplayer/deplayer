import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from '../common/Button'
import { toast } from 'react-toastify'

function ReloadPrompt() {
  const intervalMS = 60 * 60 * 1000

  useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => {
        r.update()
      }, intervalMS)
    }
  })

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  React.useEffect(() => {
    const msg =
      <>
        <div className="py-4">
          {offlineReady && <span>App ready to work offline</span>}
          {needRefresh && <span>New content available, click on reload button to update.</span>}
          {needRefresh && <Button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Reload</Button>}
        </div>
      </>

    if (!offlineReady && !needRefresh) return

    toast.info(msg, {
      autoClose: false,
    })
  }, [offlineReady, needRefresh, updateServiceWorker])

  return <></>
}

export default ReloadPrompt
