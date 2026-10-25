import { SyncBackend, validatePushPayload } from '@livestore/common'
import { EventSequenceNumber, type LiveStoreEvent } from '@livestore/common/schema'
import { Effect, Option, Queue, Stream, SubscriptionRef, type Scope } from '@livestore/utils/effect'

/**
 * Sync backend for stores that never reach a server (no backend URL, or an
 * anonymous store the server rejects): this device is the only authority,
 * so every push is confirmed by echoing it back on the live pull.
 *
 * The confirmation is what bounds the state database. The leader keeps a
 * rollback changeset per event in `__livestore_session_changeset` and only
 * discards rows once the backend confirms them. A backend that never
 * confirms keeps every changeset forever (a 60k-track queue rewrite alone
 * adds megabytes), until the state db outgrows the 2 GiB wasm heap the
 * client session must copy it into at boot and the store fails with
 * `sqlite3.backup failed with rc=7` (SQLITE_NOMEM).
 */
export const makeLocalOnlyBackend = (): Effect.Effect<SyncBackend.SyncBackend, never, Scope.Scope> =>
  Effect.gen(function* () {
    const confirmed = yield* Queue.unbounded<LiveStoreEvent.Global.Encoded>()
    // In-memory per boot: the leader resumes pushing after its persisted
    // backend head, so the first push of a boot is always ahead of ROOT.
    let head = EventSequenceNumber.Client.ROOT.global

    return SyncBackend.of({
      isConnected: yield* SubscriptionRef.make(true),
      connect: Effect.void,
      ping: Effect.void,
      // Nothing exists upstream beyond what this device pushed: report
      // "caught up", then (live) hand every push straight back.
      pull: (_cursor, options) => {
        const caughtUp = Stream.make(SyncBackend.pullResItemEmpty())
        if (options?.live !== true) return caughtUp
        return Stream.concat(
          caughtUp,
          Stream.fromQueue(confirmed).pipe(
            Stream.chunks,
            Stream.map((chunk) => ({
              batch: Array.from(chunk, (eventEncoded) => ({ eventEncoded, metadata: Option.none() })),
              pageInfo: SyncBackend.pageInfoNoMore,
            })),
          ),
        )
      },
      // Rejects re-pushes of already-confirmed events like a real backend
      // (ServerAheadError), which the leader resolves via the pending echo.
      push: (batch) =>
        Effect.gen(function* () {
          yield* validatePushPayload(batch, head)
          head = batch[batch.length - 1]!.seqNum
          yield* Queue.offerAll(confirmed, batch)
        }),
      metadata: {
        name: 'local-only',
        description: 'No sync server for this store; the device confirms its own events',
      },
      supports: { pullPageInfoKnown: true, pullLive: true },
    })
  })
