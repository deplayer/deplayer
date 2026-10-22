import * as React from 'react'
import { I18n, Translate } from 'react-redux-i18n'
import { loginWithPasskey, registerPasskey } from '../../services/syncAuth/api'
import {
  clearStoredSyncUrl,
  getStoredSyncUrl,
  getSyncUrl,
  setStoredSyncUrl
} from '../../services/syncAuth/config'
import { clearSyncSession, getSyncSession } from '../../services/syncAuth/session'

import Button from '../common/Button'

/**
 * Sync account section (Settings).
 *
 * Backend: the active sync worker URL is the stored setting (per device)
 * when present, else the build-time default (`VITE_LIVESTORE_SYNC_URL`).
 * Users can point any build at their own self-hosted worker by saving a URL
 * here; the app reloads afterwards so the store rewires (the passkey
 * session is cleared — the JWT only works on the backend that issued it).
 * Without any backend URL the store stays fully local.
 *
 * After any state change (register / sign in / sign out / URL change) the
 * app reloads: the LiveStore storeId switches between the anonymous store
 * and `user-<userId>`, and the store registry caches by storeId, so a
 * reload is the simplest correct way to switch.
 */
const SyncAccount: React.FC = () => {
  const [name, setName] = React.useState('')
  const [url, setUrl] = React.useState(() => getStoredSyncUrl() ?? '')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [session] = React.useState(() => getSyncSession())
  const syncUrl = getSyncUrl()
  const storedUrl = getStoredSyncUrl()

  const run = (action: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    action()
      .then(() => {
        window.location.reload()
      })
      .catch((err: unknown) => {
        setBusy(false)
        setError(err instanceof Error ? err.message : String(err))
      })
  }

  const saveUrl = () => {
    setError(null)
    const value = url.trim()
    if (value !== '') {
      let parsed: URL | null = null
      try {
        parsed = new URL(value)
      } catch {
        parsed = null
      }
      if (parsed === null || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
        setError(I18n.t('labels.syncUrlInvalid'))
        return
      }
    }
    if (value === '') {
      clearStoredSyncUrl()
    } else {
      setStoredSyncUrl(value)
    }
    clearSyncSession()
    window.location.reload()
  }

  const signOut = () => {
    clearSyncSession()
    window.location.reload()
  }

  return (
    <div className='my-12'>
      <h2 className='text-2xl py-3 text-base-content'>
        <Translate value="labels.sync" />
      </h2>
      <p className='text-base-content/70'>
        <Translate value="labels.syncDescription" />
      </p>

      <div className='py-3'>
        <p className='font-semibold'>
          <Translate value="labels.syncServerUrl" />
        </p>
        <p className='text-base-content/70'>
          {syncUrl !== undefined ? (
            <>
              <code>{syncUrl}</code>
              {storedUrl === undefined && (
                <span className='text-base-content/70'>
                  {' '}(<Translate value="labels.syncServerBuiltIn" />)
                </span>
              )}
            </>
          ) : (
            <Translate value="labels.syncServerNone" />
          )}
        </p>
        <div className='flex items-center flex-wrap gap-2'>
          <input
            className='input input-bordered w-72'
            data-testid='sync-server-url'
            placeholder={I18n.t('labels.syncServerUrl')}
            value={url}
            onChange={event => setUrl(event.target.value)}
          />
          <Button inverted data-testid='sync-save-url' onClick={saveUrl}>
            <Translate value="labels.save" />
          </Button>
          {storedUrl !== undefined && (
            <Button
              data-testid='sync-clear-url'
              onClick={() => {
                clearStoredSyncUrl()
                clearSyncSession()
                window.location.reload()
              }}
            >
              <Translate value="labels.syncClear" />
            </Button>
          )}
        </div>
        <p className='text-base-content/70'>
          <Translate value="labels.syncServerInstructions" />
        </p>
      </div>

      {session === null ? (
        <>
          <p className='text-base-content/70'>
            <Translate value="labels.syncMigrationHint" />
          </p>
          <div className='flex items-center flex-wrap'>
            <input
              className='input input-bordered w-48'
              data-testid='sync-name'
              placeholder={I18n.t('labels.syncName')}
              value={name}
              disabled={busy}
              onChange={event => setName(event.target.value)}
            />
            <Button
              inverted
              data-testid='sync-create-passkey'
              disabled={busy || name.trim() === '' || syncUrl === undefined}
              onClick={() => run(() => registerPasskey(name.trim()))}
            >
              <Translate value="labels.syncCreatePasskey" />
            </Button>
            <Button
              inverted
              data-testid='sync-sign-in'
              disabled={busy || syncUrl === undefined}
              onClick={() => run(() => loginWithPasskey())}
            >
              <Translate value="labels.syncSignIn" />
            </Button>
          </div>
        </>
      ) : (
        <div className='flex items-center'>
          <p className='text-base-content'>
            <Translate value="labels.syncSignedInAs" /> {session.name}
          </p>
          <Button inverted data-testid='sync-sign-out' onClick={signOut}>
            <Translate value="labels.syncSignOut" />
          </Button>
        </div>
      )}

      {error !== null && <p className='text-error'>{error}</p>}
    </div>
  )
}

export default SyncAccount
