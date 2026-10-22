# Deplayer

Music player PWA: React + Redux-Saga UI over a LiveStore (SQLite/WASM/OPFS) media library, federating remote music providers into a local collection.

## Language

**Provider**:
A remote music source (Subsonic, Jellyfin, Mstream) exposing its catalogue through the IMusicProvider seam.
_Avoid_: backend, server, connector

**Provider instance**:
One configured connection to a Provider, stored under a settings key: `<type>` for the first (`subsonic`), `<type><n>` for repeats (`subsonic2`). The provider registry (`providers/registry.ts`) is the only owner of the key-to-type rule, schema lookup and construction. A constructed Provider's `providerKey` is always its type, never the instance key (it is persisted on media rows as the display-only `stream.service`).
_Avoid_: provider key (for the settings key)

**Provider connections**:
The stored set of Provider instances and its mutations (save, remove, enable, add), expressed as pure transforms in `components/Providers/connections.ts` and persisted by `useProviderConnections`.

**Streaming provider**:
A Provider implementing the optional streaming-sync members (`getScanStatus`, `streamAlbumsSince`), and therefore participating in background library sync.
_Avoid_: syncable provider, sync backend

**Sync resume state**:
Per-Provider persisted progress of an incremental library sync: delta boundary, album-list cursor, cursor page geometry, completion flag. One `sync_state` row per Provider, owned by `SyncResumeState`.
_Avoid_: sync state (unqualified), "default" row
**Stream source**:
A resolved play target (`{url, kind}`) returned by StreamUriService. Blob-kind sources pin a whole file in memory until released; remote sources need no release.
_Avoid_: stream URI (unqualified), blob URL

**Playback queue**:
The app's single deep module owning the playback queue domain: the ordered track list plus the playback head (current position, shuffle, repeat), persisted as a `queue` head row plus `queue_items` rows (one per track in the ordered list). The shuffle order is not a second row set: it is a permutation of ordered indices stored on the head row, so toggling shuffle writes one row regardless of queue length. Callers read the normalized `QueueState` (whose `randomTrackIds` is reconstructed from that permutation) and mutate only through the queue actions; the raw row shapes (`QueueHeadRow`, `QueueItemRow`) are an implementation detail.
_Avoid_: queue state (for the raw rows), Redux queue

**Collection filter**:
The canonical filter value for the Collection view (genres/types/artists/providers/favorites). Owned by the `collection/filter` module, which is the single owner of its match semantics (OR within a category, AND across categories, exact genre/provider matching, favorites requiring membership), expressed as one shared SQL clause set from which the window, count, and all-ids queries are all derived. Smart playlists persist a projection of it (no favorites field).
_Avoid_: active filters (for the value object), filtered songs

**Collection window**:
The bounded, snapshot-semantics slice of the filtered collection the Collection view renders: refetched only on filter/search change or growth, never shifted by sync commits. The live count for the same clauses is a separate reactive query; Play All resolves the full id list as a one-shot query at click time.

**Sync batch**:
The unit a Streaming provider's page becomes when handed to BatchedMediaCommitter: partitioned against existing media rows into new / changed / unchanged. New ids commit as `MediaBulkAdded`, drifted rows as `MediaBulkUpdated`, unchanged rows commit nothing.
_Avoid_: sync diff, upsert batch

**Cursor geometry**:
The page size a saved album-list cursor was produced with. A resume whose page size differs from the stored geometry restarts the walk instead of trusting the offset.
_Avoid_: cursor version


## Relationships
- A **Streaming provider** owns exactly one **Sync resume state** row, keyed by its provider key
- A **Sync resume state** is written only after its page committed (BatchedMediaCommitter flush success); a failed flush must leave the row untouched
- **Cursor geometry** is persisted alongside the cursor it describes
- A **Stream source** of blob kind is released exactly when playback moves past it (PlaybackController), or when the SongView download list is replaced/unmounted
- The **Playback queue** is read via `useQueue`/`readQueue`; the playback head resolves to the persisted `currentTrackId` column, falling back to a point read of the item at the active position in `queue_items`
- Shuffle reorders the random list only and keeps the active track in position; the **Stream source** release on playback advance is the queue's one effect on media
- The shuffle order is a permutation of ordered indices on the head row, never a set of `queue_items` rows: a toggle is a single head-row write, and navigation maps the active position through the permutation before point-reading the ordered row it needs
- A shuffle flag with no stored permutation (the append path omits it) means the active list IS the ordered list. The UI (`getActiveTrackIds`), the materialized `currentTrackId`, and the step actions all resolve the active order through that same fallback, so they cannot disagree about which track a position points at
- A **Sync batch** can only detect drift in fields the content-derived media id does not cover (type, duration, discNumber, genres, stream membership, externalId, shareUrl, filePath); renames produce new ids and arrive as adds. Stream/cover JSON blobs are deliberately not compared — URL rotation is not an update
- All raw SQL against LiveStore uses positional array binds — object-form binds are mangled into `$key` named params (keys absent from the SQL text are dropped), and raw `store.query` returns an array of row objects. Pinned by `livestore-bind-contract.spec.ts`

## Example dialogue

> **Dev:** "Provider B just enabled streaming sync — where does its first sync start?"
> **Domain expert:** "At a null boundary: no **Sync resume state** row for B exists. A's cursor never leaks into B — each Provider resumes only from its own row."

> **Dev:** "And the old `default` sync_state row?"
> **Domain expert:** "Legacy single-row layout. It is adopted once by the first **Streaming provider** that reads it, then orphaned."
> **Dev:** "Which list does `currentPlaying` index into?"
> **Domain expert:** "The active list of the **Playback queue**: `randomTrackIds` when shuffle is on, `trackIds` otherwise. The stored `currentTrackId` always wins when present."


## Flagged ambiguities

- "sync state" was used for both the LiveStore table and Redux-era sync flags — resolved: **Sync resume state** means only the per-Provider persisted progress.
