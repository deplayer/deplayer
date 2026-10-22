import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'

import { getSyncUrl } from './config'
import { setSyncSession } from './session'

/** Response of `/auth/register/options` and `/auth/login/options`. */
interface OptionsResponse<TOptions> {
  challengeId: string
  options: TOptions
}

/** Response of `/auth/register/verify`. */
interface RegisterVerifyResponse {
  userId: string
  token: string
}

/** Response of `/auth/login/verify`. */
interface LoginVerifyResponse extends RegisterVerifyResponse {
  name: string
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const baseUrl = getSyncUrl()
  if (baseUrl === undefined) {
    throw new Error('Sync is not configured. Set a sync worker URL in Settings → Sync')
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(errorBody?.error ?? `Sync request failed: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

/**
 * Registers a new passkey account. Requires the WebAuthn user-verification
 * flow to complete on the user's device/platform.
 */
export async function registerPasskey(name: string): Promise<void> {
  const options = await postJson<OptionsResponse<PublicKeyCredentialCreationOptionsJSON>>('/auth/register/options', { name })
  const response = await startRegistration({ optionsJSON: options.options })
  const result = await postJson<RegisterVerifyResponse>('/auth/register/verify', {
    challengeId: options.challengeId,
    response
  })
  setSyncSession({ token: result.token, userId: result.userId, name })
}

/**
 * Signs in with an existing passkey. The account name is returned by the
 * worker so the client never needs to store it.
 */
export async function loginWithPasskey(): Promise<void> {
  const options = await postJson<OptionsResponse<PublicKeyCredentialRequestOptionsJSON>>('/auth/login/options')
  const response = await startAuthentication({ optionsJSON: options.options })
  const result = await postJson<LoginVerifyResponse>('/auth/login/verify', {
    challengeId: options.challengeId,
    response
  })
  setSyncSession({ token: result.token, userId: result.userId, name: result.name })
}
