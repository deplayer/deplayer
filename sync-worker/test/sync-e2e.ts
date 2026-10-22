/**
 * End-to-end integration test for the Cloudflare sync backend
 * (sync-worker + @livestore/sync-cf).
 *
 * NOT part of the vitest suite — run manually against a live worker:
 *   1. npm run worker:dev        (wrangler dev, sync-worker, port 8787)
 *   2. npm run worker:e2e        (this script; set SYNC_E2E_URL to override)
 *
 * The npm script sets NODE_ENV=production: LiveStore's dev-only
 * materializer-hash purity check misfires for materializers that embed
 * Date.now() (the app's do) when two dev-mode clients sync the same event.
 *
 * Scenario (mirrors the user story in docs/livestore-sync.md):
 *   - C1: user-A, online — updates the playback queue.
 *   - C2: user-A, offline (closed port) — local writes work immediately,
 *     C1's updates are not visible while offline.
 *   - C2 reconnects (same persistence dir) → both clients converge on the
 *     same queue and their eventlogs carry both events with deterministic
 *     (rebased) sequence ordering.
 *   - C3: user-B trying to access user-A's store → rejected (isolation).
 *   - C4: anonymous client (no sync payload) → storeId cannot be resolved,
 *     sync is not enabled, local-only writes work.
 *
 * The schema below mirrors the app's queue tables and `v1.QueueUpdated`
 * event from `src/stores/livestore/schema.ts` (the app schema is not
 * importable in Node — it pulls in Vite-only `?worker`/`?sharedworker`
 * imports via `./queue`). Table shapes, event name, and the replace-style
 * materializer are kept identical so LiveStore version-specific sync
 * behaviour is exercised with the same table/event semantics.
 */
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { makeAdapter } from '@livestore/adapter-node'
import { EventSequenceNumber } from '@livestore/common/schema'
import {
  createStorePromise,
  makeSchema,
  Events,
  Schema,
  State,
} from '@livestore/livestore'
import type { Store } from '@livestore/livestore'
import { makeWsSync } from '@livestore/sync-cf/client'
import { issueToken } from '../src/token.js'

const SYNC_URL = process.env.SYNC_E2E_URL ?? 'ws://127.0.0.1:8787'
// Must match JWT_SECRET in sync-worker/.dev.vars (wrangler dev auto-loads it).
const DEV_SECRET = 'dev-secret-change-me-0123456789-abcdefghijklmnopqrstuvwxyz'

/** Mirrors `ORDERED_LIST` in src/stores/livestore/queue/types.ts. */
const ORDERED_LIST = 'ordered'
const QUEUE_ID = 'e2e-queue'

// ---------------------------------------------------------------------------
// Schema (mirror of the app's queue tables / v1.QueueUpdated event)
// ---------------------------------------------------------------------------

const tables = {
  queue: State.SQLite.table({
    name: 'queue',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      shuffle: State.SQLite.boolean({ default: false }),
      repeat: State.SQLite.boolean({ default: false }),
      updatedAt: State.SQLite.integer({}),
    },
  }),
  queueItems: State.SQLite.table({
    name: 'queue_items',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      queueId: State.SQLite.text({}),
      list: State.SQLite.text({}),
      position: State.SQLite.integer({}),
      trackId: State.SQLite.text({}),
    },
    indexes: [
      { name: 'idx_queue_items_queue_list_position', columns: ['queueId', 'list', 'position'] },
      { name: 'idx_queue_items_queue_list_trackId', columns: ['queueId', 'list', 'trackId'] },
    ],
  }),
}

const events = {
  queueUpdated: Events.synced({
    name: 'v1.QueueUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      trackIds: Schema.Array(Schema.String),
      shuffle: Schema.Boolean,
      repeat: Schema.Boolean,
    }),
  }),
}

const state = State.SQLite.makeState({
  tables,
  materializers: {
    'v1.QueueUpdated': ({ id, trackIds, shuffle, repeat }: { readonly id: string; readonly trackIds: readonly string[]; readonly shuffle: boolean; readonly repeat: boolean }) => {
      const now = Date.now()
      const head = tables.queue
        .insert({ id, shuffle, repeat, updatedAt: now })
        .onConflict('id', 'update', { shuffle, repeat, updatedAt: now })
      // Rebuild the ordered rows from the event array. Deterministic ids
      // (queueId:ordered:position) keep eventlog rematerialization idempotent.
      return [
        head,
        tables.queueItems.delete().where('queueId', '=', id),
        ...trackIds.map((trackId: string, position: number) =>
          tables.queueItems.insert({
            id: `${id}:${ORDERED_LIST}:${position}`,
            queueId: id,
            list: ORDERED_LIST,
            position,
            trackId,
          })
        ),
      ]
    },
  },
})

const schema = makeSchema({ events, state })

type AppStore = Store<typeof schema>

type QueueEventRef = {
  seqNum: EventSequenceNumber.Client.Composite
  trackIds: readonly string[]
}

// ---------------------------------------------------------------------------
// Test scaffolding
// ---------------------------------------------------------------------------

let failures = 0
const check = (cond: boolean, label: string) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) {
    failures += 1
  }
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    t.unref()
  })

async function waitUntil(cond: () => boolean | Promise<boolean>, timeoutMs: number, label: string): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await cond()) {
      return true
    }
    await delay(250)
  }
  check(await cond(), `${label} (timed out after ${timeoutMs}ms)`)
  return false
}

async function makeClient(opts: {
  baseDirectory: string
  clientId: string
  url: string
  storeId: string
  payload?: { authToken: string }
}): Promise<AppStore> {
  const adapter = makeAdapter({
    storage: { type: 'fs', baseDirectory: opts.baseDirectory },
    clientId: opts.clientId,
    sync: {
      backend: makeWsSync({ url: opts.url }),
      initialSyncOptions: { _tag: 'Skip' },
      onSyncError: 'ignore',
    },
  })
  return createStorePromise({
    schema,
    adapter,
    storeId: opts.storeId,
    syncPayload: opts.payload,
  })
}

/** Synchronous read of the ordered track list for QUEUE_ID. */
function trackIds(store: AppStore): readonly string[] {
  const rows = store.query(tables.queueItems.where({ queueId: QUEUE_ID }))
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => row.trackId)
}

/**
 * Live tail of `v1.QueueUpdated` events (the `store.events()` stream is a
 * tail, not a log scan: it only observes events materialized after the
 * subscription starts). Collects into `refs` on a background pump; `stop`
 * tears the pump down before the store shuts down.
 */
function tailQueueEvents(store: AppStore): { refs: QueueEventRef[]; stop: () => Promise<void> } {
  const refs: QueueEventRef[] = []
  const iter = store.events({ filter: ['v1.QueueUpdated'] })[Symbol.asyncIterator]()
  const pump = (async () => {
    for (;;) {
      const result = await iter.next()
      if (result.done) {
        break
      }
      if (result.value.name === 'v1.QueueUpdated') {
        refs.push({ seqNum: result.value.seqNum, trackIds: [...result.value.args.trackIds] })
      }
    }
  })()
  let stopped = false
  return {
    refs,
    stop: async () => {
      if (stopped) {
        return
      }
      stopped = true
      // The iterator can be parked on a store that is shutting down; bound
      // teardown so it can never hang. The pump is detached: a pending
      // promise holds no process handles.
      await Promise.race([
        Promise.resolve(iter.return?.()),
        delay(3_000).then(() => undefined),
      ])
      void pump.catch(() => undefined)
    },
  }
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

let tailC1: ReturnType<typeof tailQueueEvents> | undefined
let tailC2: ReturnType<typeof tailQueueEvents> | undefined

const root = mkdtempSync(join(tmpdir(), 'livestore-sync-e2e-'))
const dirs = Array.from({ length: 4 }, (_, i) => {
  const dir = join(root, `c${i + 1}`)
  mkdirSync(dir, { recursive: true })
  return dir
})
const stores: AppStore[] = []

const closeAll = async () => {
  await Promise.allSettled(
    stores.map((s) =>
      Promise.race([
        s.shutdownPromise(),
        delay(5_000).then(() => undefined), // LiveStore shutdown can hang on an open sync socket
      ])
    )
  )
  rmSync(root, { recursive: true, force: true })
}

console.log(`== LiveStore sync-cf e2e (sync: ${SYNC_URL}) ==`)

try {
  // Unique user ids per run: re-runs against a persistent backend (wrangler
  // dev state or production) must not collide with stale eventlog state from
  // an earlier run — the same storeId carrying events from a different
  // materializer hash would raise MaterializerHashMismatchError on pull.
  const run = Date.now().toString(36)
  const USER_A = `A-${run}`
  const USER_B = `B-${run}`
  // Dev-only bypass of the WebAuthn flow: mint JWTs exactly like the worker
  // would after passkey verification.
  const tokenA = await issueToken(USER_A, DEV_SECRET)
  const tokenB = await issueToken(USER_B, DEV_SECRET)

  const STORE_A = `user-${USER_A}`
  const OFFLINE_URL = 'ws://127.0.0.1:1' // port 1 is never bound

  // C1: user-A, online.
  const c1 = await makeClient({
    baseDirectory: dirs[0],
    clientId: 'e2e-c1',
    url: SYNC_URL,
    storeId: STORE_A,
    payload: { authToken: tokenA },
  })
  stores.push(c1)
  tailC1 = tailQueueEvents(c1)
  await delay(2_000) // let the sync connection establish
  c1.commit(events.queueUpdated({ id: QUEUE_ID, trackIds: ['a'], shuffle: false, repeat: false }))

  // C2: user-A, offline (closed port) — local write works immediately and
  // C1's event is not visible while the backend is unreachable.
  const c2offline = await makeClient({
    baseDirectory: dirs[1],
    clientId: 'e2e-c2',
    url: OFFLINE_URL,
    storeId: STORE_A,
    payload: { authToken: tokenA },
  })
  stores.push(c2offline)
  c2offline.commit(events.queueUpdated({ id: QUEUE_ID, trackIds: ['b'], shuffle: false, repeat: false }))
  await delay(1_000)
  const offlineSeen = trackIds(c2offline)
  check(
    offlineSeen.length === 1 && offlineSeen[0] === 'b',
    `offline C2 sees its own write only (got ${JSON.stringify(offlineSeen)})`
  )
  await c2offline.shutdownPromise().catch(() => undefined)
  stores.splice(stores.indexOf(c2offline), 1)

  // C2 reconnects (same persistence dir) on the real URL.
  const c2 = await makeClient({
    baseDirectory: dirs[1],
    clientId: 'e2e-c2',
    url: SYNC_URL,
    storeId: STORE_A,
    payload: { authToken: tokenA },
  })
  stores.push(c2)
  tailC2 = tailQueueEvents(c2)

  const converged = await waitUntil(
    () => {
      const a = trackIds(c1)
      const b = trackIds(c2)
      // Replace semantics: both end up with the latest committed queue state
      // (whichever of 'a'/'b' was confirmed last upstream — 'b', since C2
      // was offline when 'a' was committed).
      return a.length === 1 && b.length === 1 && a[0] === b[0] && (a[0] === 'a' || a[0] === 'b')
    },
    15_000,
    'C1 and C2 converge on the same queue after reconnect'
  )
  check(converged, `converged queue: C1=${JSON.stringify(trackIds(c1))} C2=${JSON.stringify(trackIds(c2))}`)

  // Eventlog determinism: C1's live tail spans both events ('a' self-commit,
  // 'b' pulled from C2 after it pushed on reconnect), so the order C1
  // observed is the upstream (backend) order: both present, b after a.
  const t1 = tailC1
  const t2 = tailC2
  if (!t1 || !t2) {
    check(false, 'event tails unavailable')
  } else {
    const findRef = (refs: QueueEventRef[], trackId: string) => refs.find((e) => e.trackIds.includes(trackId))
    const aOnC1 = findRef(t1.refs, 'a')
    const bOnC1 = findRef(t1.refs, 'b')
    check(
      Boolean(aOnC1) && Boolean(bOnC1),
      `C1 tail observed both events (a=${Boolean(aOnC1)}, b=${Boolean(bOnC1)})`
    )
    if (aOnC1 && bOnC1) {
      check(
        EventSequenceNumber.Client.isGreaterThan(bOnC1.seqNum, aOnC1.seqNum),
        'upstream event order: b (offline write, confirmed on reconnect) after a'
      )
    }
    console.log(
      `  INFO  tails: C1=${JSON.stringify(t1.refs.map((e) => e.trackIds))} C2=${JSON.stringify(t2.refs.map((e) => e.trackIds))}`
    )
  }

  // Isolation: user-B cannot read user-A's store.
  const c3 = await makeClient({
    baseDirectory: dirs[2],
    clientId: 'e2e-c3',
    url: SYNC_URL,
    storeId: STORE_A,
    payload: { authToken: tokenB },
  })
  stores.push(c3)
  await delay(5_000)
  const c3Tracks = trackIds(c3)
  check(c3Tracks.length === 0, `user-B rejected from user-A store (got ${JSON.stringify(c3Tracks)})`)

  // Anonymous: no sync payload → sync not enabled, local writes still work.
  const c4 = await makeClient({
    baseDirectory: dirs[3],
    clientId: 'e2e-c4',
    url: SYNC_URL,
    storeId: 'anonymous-e2e',
  })
  stores.push(c4)
  c4.commit(events.queueUpdated({ id: QUEUE_ID, trackIds: ['local-only'], shuffle: false, repeat: false }))
  const c4Tracks = await waitUntil(
    () => trackIds(c4).length === 1,
    5_000,
    'anonymous C4 applies local writes'
  )
  check(c4Tracks, `anonymous client works locally (got ${JSON.stringify(trackIds(c4))})`)
} catch (err) {
  failures += 1
  console.error('E2E crashed:', err)
} finally {
  await Promise.allSettled([tailC1?.stop(), tailC2?.stop()])
  await closeAll()
}

console.log(failures === 0 ? '\n== ALL E2E CHECKS PASSED ==' : `\n== ${failures} E2E CHECK(S) FAILED ==`)
process.exit(failures === 0 ? 0 : 1)
