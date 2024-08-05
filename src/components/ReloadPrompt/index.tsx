import './index.css'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from '../common/Button'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
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

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="ReloadPrompt-container bg-gray-900 p-0 m-0 w-0 h-0">
      {(offlineReady || needRefresh)
        && <div className="ReloadPrompt-toast p-10">
          <div className="ReloadPrompt-message py-4">
            {offlineReady
              ? <span>App ready to work offline</span>
              : <span>New content available, click on reload button to update.</span>
            }
          </div>
          {needRefresh && <Button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Reload</Button>}
          <Button large onClick={() => close()}>Close</Button>
        </div>
      }
    </div>
  )
}

export default ReloadPrompt
