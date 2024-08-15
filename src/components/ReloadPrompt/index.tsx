import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from '../common/Button'
import { toast } from 'react-toastify'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
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
  }, [offlineReady, needRefresh])
}

export default ReloadPrompt
