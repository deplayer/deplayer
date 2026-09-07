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

**Cursor geometry**:
The page size a saved album-list cursor was produced with. A resume whose page size differs from the stored geometry restarts the walk instead of trusting the offset.
_Avoid_: cursor version

## Relationships

- A **Streaming provider** owns exactly one **Sync resume state** row, keyed by its provider key
- A **Sync resume state** is written only after its page committed (BatchedMediaCommitter flush success); a failed flush must leave the row untouched
- **Cursor geometry** is persisted alongside the cursor it describes

## Example dialogue

> **Dev:** "Provider B just enabled streaming sync — where does its first sync start?"
> **Domain expert:** "At a null boundary: no **Sync resume state** row for B exists. A's cursor never leaks into B — each Provider resumes only from its own row."

> **Dev:** "And the old `default` sync_state row?"
> **Domain expert:** "Legacy single-row layout. It is adopted once by the first **Streaming provider** that reads it, then orphaned."

## Flagged ambiguities

- "sync state" was used for both the LiveStore table and Redux-era sync flags — resolved: **Sync resume state** means only the per-Provider persisted progress.
