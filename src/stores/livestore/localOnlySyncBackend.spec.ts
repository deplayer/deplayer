import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeAdapter } from '@livestore/adapter-node'
import { createStorePromise, StoreInternalsSymbol } from '@livestore/livestore'
import { Effect } from '@livestore/utils/effect'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestLiveStore } from '../../test-utils/liveStore'
import { favoriteEvents } from './events/favorites'
import { makeLocalOnlyBackend } from './localOnlySyncBackend'
import { schema } from './schema'

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const openStore = (baseDirectory: string) =>
  createStorePromise({
    schema,
    storeId: 'local-only',
    adapter: makeAdapter({
      storage: { type: 'fs', baseDirectory },
      sync: { backend: () => makeLocalOnlyBackend() },
    }),
  })

const leaderSyncState = (store: TestLiveStore) =>
  Effect.runPromise(store[StoreInternalsSymbol].clientSession.leaderThread.syncState.get)

describe('makeLocalOnlyBackend', () => {
  it('confirms commits so the persisted state db drops their rollback changesets', { timeout: 30_000 }, async () => {
    const baseDirectory = mkdtempSync(join(tmpdir(), 'deplayer-local-only-'))
    dirs.push(baseDirectory)

    const COMMITS = 30
    const store = await openStore(baseDirectory)
    // mediaUnfavorited has a pure materializer (no Date.now()), so the
    // dev-mode materializer hash check cannot interfere.
    for (let i = 0; i < COMMITS; i++) {
      store.commit(favoriteEvents.mediaUnfavorited({ mediaId: `media-${i}` }))
    }
    // Global sequence numbers start at 1, so the last commit is #COMMITS.
    await vi.waitFor(
      async () => expect((await leaderSyncState(store)).upstreamHead.global).toBe(COMMITS),
      { timeout: 10_000, interval: 50 }
    )
    await store.shutdownPromise()

    // A reboot loads the leader's persisted state db into the client session.
    const reopened = await openStore(baseDirectory)
    const [{ count }] = reopened.query<{ count: number }[]>({
      query: 'SELECT count(*) AS count FROM __livestore_session_changeset',
      bindValues: {},
    })
    await reopened.shutdownPromise()
    expect(count).toBeLessThanOrEqual(1)
  })
})
