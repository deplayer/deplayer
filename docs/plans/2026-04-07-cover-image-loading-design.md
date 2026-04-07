# Cover Image Loading Optimization

**Date:** 2026-04-07
**Status:** Approved

## Problem

Cover images in the virtualized MusicTable overwhelm Navidrome's Subsonic API. Every visible row fires an independent `getCoverArt` request with no concurrency control, no deduplication across songs sharing an album, and no caching. Thumbnail URLs lack a `&size=` param, so full-size images are fetched even for 48px covers.

## Solution

A `CoverImageService` singleton with concurrency limiting, URL deduplication, Cache API persistence, and a `useCoverImage` hook that replaces the existing `LazyImage` component.

## CoverImageService

Singleton managing all cover image fetching:

- **Concurrency pool**: Max 3 simultaneous requests to Navidrome. Queue is LIFO so visible (most recently requested) rows load first.
- **URL deduplication**: `Map<url, Promise<string>>`. Multiple songs sharing an album cover share one request/promise.
- **Cancellation**: Each consumer passes an `AbortSignal`. When no consumers remain for a URL, the in-flight fetch is aborted and the queue slot freed.
- **Cache API**: Check `caches.open('covers')` before fetching. Store responses on success. Cache hits bypass the concurrency pool.
- **Object URLs**: Fetched blobs are converted via `URL.createObjectURL()` for display. Revoked on cleanup.

Public API:

```ts
request(url: string, signal: AbortSignal): Promise<string>  // returns object URL
```

## useCoverImage Hook

```ts
useCoverImage(url: string | undefined): string | undefined
```

- On mount: calls `CoverImageService.request(url, signal)`
- On unmount: aborts signal, revokes object URL
- On URL change: cleans up previous, requests new
- Returns `undefined` while loading, object URL when ready

## Component Changes

**CoverImage.tsx**: Uses `useCoverImage(thumbnailUrl)`. Renders object URL or `/disc.svg` placeholder. Fade-in via CSS transition when src appears.

**LazyImage**: Deleted. Its preloading/fallback logic is replaced by the service + hook.

**SubsonicApiProvider.ts**: Append `&size=100` to `thumbnailUrl`:

```ts
thumbnailUrl: this.coverBase + "&id=" + song.coverArt + "&size=100",
fullUrl: this.coverBase + "&id=" + song.coverArt,
```

## Tradeoffs

- **LIFO queue**: Visible rows prioritized; mid-scroll images starved but already off-screen.
- **Max 3 concurrent**: ~3-4 rounds to fill a screen of unique covers on first load. Cache makes this one-time.
- **Cache growth**: ~500 albums × ~10KB = ~5MB. Negligible.
- **No cache invalidation**: Stale if cover art changes in Navidrome. Acceptable for now.
- **Object URL lifecycle**: Must revoke on cleanup to avoid memory leaks.

## Files

| Action | File |
|--------|------|
| New | `src/services/CoverImageService.ts` |
| New | `src/hooks/useCoverImage.ts` |
| Modify | `src/components/MusicTable/CoverImage.tsx` |
| Modify | `src/providers/SubsonicApiProvider.ts` |
| Verify | `src/components/Player/Cover.tsx` (uses fullUrl) |
| Delete | `src/components/LazyImage/index.tsx` |
| Delete | `src/styles/lazy-image.scss` |
| Untouched | `MusicTable.tsx`, `SongRow`, data layer, schema |
