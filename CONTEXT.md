# Deplayer

Music player PWA: React + Redux-Saga UI over a LiveStore (SQLite/WASM/OPFS) media library, federating remote music providers into a local collection.

## Language

**Provider**:
A remote music source (Subsonic, Jellyfin, Mstream) exposing its catalogue through the IMusicProvider seam.
_Avoid_: backend, server, connector

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
The app's single deep module owning the playback queue domain: the ordered track lists plus the playback head (current position, shuffle, repeat), persisted as one `queue` row. Callers read the normalized `QueueState` and mutate only through the queue actions; the raw row shape (`QueueRecord`) is an implementation detail.
_Avoid_: queue state (for the raw row), Redux queue


**Collection filter**:
The canonical filter value for the Collection view (genres/types/artists/providers/favorites). Owned by the `collection/filter` module, which is the single owner of its match semantics (OR within a category, AND across categories, exact genre/provider matching, favorites requiring membership) and of the query plan that evaluates it. Smart playlists persist a projection of it (no favorites field).
_Avoid_: active filters (for the value object), filtered songs

**Cursor geometry**:
The page size a saved album-list cursor was produced with. A resume whose page size differs from the stored geometry restarts the walk instead of trusting the offset.
_Avoid_: cursor version


## Relationships
- A **Streaming provider** owns exactly one **Sync resume state** row, keyed by its provider key
- A **Sync resume state** is written only after its page committed (BatchedMediaCommitter flush success); a failed flush must leave the row untouched
- **Cursor geometry** is persisted alongside the cursor it describes
- A **Stream source** of blob kind is released exactly when playback moves past it (PlaybackController), or when the SongView download list is replaced/unmounted
- The **Playback queue** is read via `useQueue`/`readQueue`; the playback head resolves to the persisted `currentTrackId` column, falling back to the index into the active track list
- Shuffle reorders the random list only and keeps the active track in position; the **Stream source** release on playback advance is the queue's one effect on media
- A **Collection filter** is evaluated by the planner over the `media_genres` read model; the rows path post-filters with the same predicate that defines the semantics, so SQL and JS can't diverge



## Example dialogue

> **Dev:** "Provider B just enabled streaming sync — where does its first sync start?"
> **Domain expert:** "At a null boundary: no **Sync resume state** row for B exists. A's cursor never leaks into B — each Provider resumes only from its own row."

> **Dev:** "And the old `default` sync_state row?"
> **Domain expert:** "Legacy single-row layout. It is adopted once by the first **Streaming provider** that reads it, then orphaned."
> **Dev:** "Which list does `currentPlaying` index into?"
> **Domain expert:** "The active list of the **Playback queue**: `randomTrackIds` when shuffle is on, `trackIds` otherwise. The stored `currentTrackId` always wins when present."


## Flagged ambiguities

- "sync state" was used for both the LiveStore table and Redux-era sync flags — resolved: **Sync resume state** means only the per-Provider persisted progress.
