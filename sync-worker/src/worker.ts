import { handleSyncRequest, makeDurableObject, matchSyncRequest } from '@livestore/sync-cf/cf-worker'
import type { DoState } from '@livestore/sync-cf/cf-worker'
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server'
import type { Env } from './env'
import { authorizeSync, issueToken } from './token'
import { AuthDO } from './AuthDO'
export { AuthDO }

/**
 * JWT_SECRET for the current isolate. Captured in `SyncBackendDO`'s
 * constructor (Durable Objects are constructed before their first
 * request) and read by the DO-side `onPush`/`onPull` callbacks, which
 * have no direct access to `env`.
 */
const secretRef = { value: '' }

/**
 * LiveStore sync backend Durable Object.
 *
 * `makeDurableObject` generates the class implementing the sync RPC
 * interface (WebSocket + HTTP transports). Every connection and every
 * push/pull is re-authorized through `authorizeSync` (JWT + storeId
 * ownership), so a forwarded payload can never be forged by the client.
 */
export class SyncBackendDO extends makeDurableObject({
  onPush: async (_message, { storeId, payload }) => {
    await authorizeSync(payload, storeId, secretRef.value)
  },
  onPull: async (_message, { storeId, payload }) => {
    await authorizeSync(payload, storeId, secretRef.value)
  },
}) {
  constructor(ctx: DoState, env: Env) {
    super(ctx, env)
    secretRef.value = env.JWT_SECRET
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx)
  },
  durableObjects: {
    SYNC_BACKEND_DO: SyncBackendDO,
    AUTH_DO: AuthDO,
  },
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

/**
 * Route dispatch:
 * - `/auth/*` POST routes → WebAuthn registration/login against the
 *   singleton `AuthDO` (Origin checked against ALLOWED_ORIGINS)
 * - requests carrying `storeId` + `transport` params → LiveStore sync
 *   traffic, forwarded to `SYNC_BACKEND_DO`
 * - everything else → 404
 */
async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const origin = request.headers.get('origin')
  if (origin !== null && !env.ALLOWED_ORIGINS.split(',').includes(origin)) {
    return new Response('Forbidden', { status: 403, headers: { 'Content-Type': 'text/plain' } })
  }
  const corsHeaders: Record<string, string> = {}
  if (origin !== null) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      },
    })
  }

  const pathname = new URL(request.url).pathname
  if (pathname.startsWith('/auth/')) {
    return handleAuthRoute(request, env, pathname, corsHeaders)
  }

  const searchParams = matchSyncRequest(request)
  if (searchParams !== undefined) {
    return handleSyncRequest({
      request,
      searchParams,
      // `env` is intentionally omitted: passing the full `Env` (or even just the
      // sync DO binding) makes TS recurse through the sync-cf RPC brand types and
      // report TS2589. At runtime handleSyncRequest falls back to the worker's
      // `env` global (cloudflare:workers), which is this same object.
      ctx,
      syncBackendBinding: 'SYNC_BACKEND_DO',
      headers: corsHeaders,
      validatePayload: async (payload, { storeId }) => {
        await authorizeSync(payload, storeId, env.JWT_SECRET)
      },
    })
  }
  return new Response('Not found', { status: 404, headers: corsHeaders })
}

/** WebAuthn routes. The Origin header is passed to the DO as `expectedOrigin`. */
async function handleAuthRoute(
  request: Request,
  env: Env,
  pathname: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' }, corsHeaders)
    }
    const rawBody = await request.text()
    const body: unknown = rawBody.length > 0 ? JSON.parse(rawBody) : {}
    if (typeof body !== 'object' || body === null) {
      return jsonResponse(400, { error: 'Invalid request' }, corsHeaders)
    }
    const fields = body as Record<string, unknown>
    const origin = request.headers.get('origin') ?? ''
    const authDo = env.AUTH_DO.get(env.AUTH_DO.idFromName('global'))

    switch (pathname) {
      case '/auth/register/options': {
        if (typeof fields.name !== 'string') {
          return jsonResponse(400, { error: 'Missing name' }, corsHeaders)
        }
        const { challengeId, options } = await authDo.registerOptions(fields.name)
        return jsonResponse(200, { challengeId, options }, corsHeaders)
      }
      case '/auth/register/verify': {
        if (typeof fields.challengeId !== 'string' || typeof fields.response !== 'object' || fields.response === null) {
          return jsonResponse(400, { error: 'Invalid request' }, corsHeaders)
        }
        const { userId } = await authDo.registerVerify(fields.challengeId, fields.response as RegistrationResponseJSON, origin)
        const token = await issueToken(userId, env.JWT_SECRET)
        return jsonResponse(200, { userId, token }, corsHeaders)
      }
      case '/auth/login/options': {
        const { challengeId, options } = await authDo.loginOptions()
        return jsonResponse(200, { challengeId, options }, corsHeaders)
      }
      case '/auth/login/verify': {
        if (typeof fields.challengeId !== 'string' || typeof fields.response !== 'object' || fields.response === null) {
          return jsonResponse(400, { error: 'Invalid request' }, corsHeaders)
        }
        const { userId, name } = await authDo.loginVerify(fields.challengeId, fields.response as AuthenticationResponseJSON, origin)
        const token = await issueToken(userId, env.JWT_SECRET)
        return jsonResponse(200, { userId, name, token }, corsHeaders)
      }
      default:
        return jsonResponse(404, { error: 'Not found' }, corsHeaders)
    }
  } catch (error) {
    return jsonResponse(400, { error: error instanceof Error ? error.message : 'Request failed' }, corsHeaders)
  }
}
