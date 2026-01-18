# Fix Plan: Player Not Showing When Song is Clicked

## Problem Analysis

### Root Cause
The player controls are not showing because of a **data type mismatch** between LiveStore and Redux:

- **LiveStore queue**: Stores `currentPlaying` as an **INDEX** (number) into the `trackIds` array
- **PlayerControls component**: Expects `currentPlaying` to be a **TRACK ID** (string)

### Evidence from Logs
```
PlayerControls.tsx:306 No current playing id
```

This happens at line 304-310 in `PlayerControls.tsx`:
```typescript
const currentPlayingId = this.props.queue.currentPlaying  // Gets INDEX (0) instead of TRACK ID
if (!currentPlayingId) {  // 0 is falsy! So this returns null
  console.log("No current playing id")
  return null
}
```

When `currentPlaying` is `0` (the first track), JavaScript treats it as falsy, so the player returns null and doesn't render.

### Current Flow
1. User clicks song → `ensureMediaInQueueAndPlay()` 
2. Queue helper → `playAllAction()` → Creates queue with `currentPlaying: 0` (index)
3. LiveStore stores: `{ trackIds: [...], currentPlaying: 0 }`
4. `PlayerContainer.tsx` line 43: Passes `currentPlaying: 0` to PlayerControls
5. `PlayerControls.tsx` line 304: Treats `0` as track ID → FAIL (falsy check)

## Solution

### File to Fix
`src/containers/PlayerContainer.tsx` (lines 31-48)

### Change Required
Convert the LiveStore index to the actual track ID before passing to PlayerControls:

**Current code (BROKEN):**
```typescript
const queue = liveQueue ? {
  trackIds,
  randomTrackIds: parseTrackIds(liveQueue.randomTrackIds),
  currentPlaying: liveQueue.currentPlaying,  // ❌ Passes index (0, 1, 2...)
  repeat: liveQueue.repeat,
  shuffle: liveQueue.shuffle,
  nextSongId: liveQueue.nextSongId,
  prevSongId: liveQueue.prevSongId
} : queueDefaultState
```

**Fixed code:**
```typescript
// Convert LiveStore index to track ID for PlayerControls
const currentPlayingId = (liveQueue?.currentPlaying !== null && liveQueue?.currentPlaying !== undefined)
  ? trackIds[liveQueue.currentPlaying]  // ✅ Get actual track ID from array
  : null

const queue = liveQueue ? {
  trackIds,
  randomTrackIds: parseTrackIds(liveQueue.randomTrackIds),
  currentPlaying: currentPlayingId,  // ✅ Passes track ID string
  repeat: liveQueue.repeat,
  shuffle: liveQueue.shuffle,
  nextSongId: liveQueue.nextSongId,
  prevSongId: liveQueue.prevSongId
} : queueDefaultState
```

### Why This Fix Works
1. `trackIds[liveQueue.currentPlaying]` converts index → track ID
2. PlayerControls receives a string like `"alice-cooper-muscle-of-love-0004-04-crazy-little-child"`
3. The falsy check `if (!currentPlayingId)` now correctly handles empty strings/null
4. The lookup `collection.rows[currentPlayingId]` finds the correct media object

## Implementation Steps

1. ✅ **Identify root cause** - DONE (index vs track ID mismatch)
2. **Edit `src/containers/PlayerContainer.tsx`**:
   - Add logic to convert `liveQueue.currentPlaying` (index) to track ID
   - Insert between lines 33-40 (after `trackIds` is defined, before `queue` object is created)
3. **Build and test**:
   - Run `npm run build`
   - Test clicking a song
   - Verify player controls appear
   - Verify song plays

## Expected Outcome

**Before:**
- Click song → No player controls
- Console: "No current playing id"
- No audio playback

**After:**
- Click song → Player controls appear
- Song starts playing
- Progress bar updates
- No console errors

## Additional Notes

### Why Was This Not Caught Earlier?
This is a legacy migration issue. The old Redux queue stored `currentPlaying` as a track ID string, but LiveStore uses a normalized schema where `currentPlaying` is an index for efficiency.

The `PlayerContainer.tsx` was meant to bridge this gap but missed the conversion.

### Related Code
- `src/stores/livestore/hooks/useQueue.ts` - Returns queue with index
- `src/stores/livestore/hooks/useQueue.ts:83-95` - `useCurrentTrack` hook does this conversion correctly (reference implementation)
- `src/components/Player/PlayerControls.tsx:304-316` - Expects track ID string

### Testing Checklist
After fix:
- [ ] Click song in music table → Player appears and plays
- [ ] Click next/prev buttons → Changes track correctly  
- [ ] Seek bar works
- [ ] Volume control works
- [ ] Notifications appear (if enabled)
- [ ] Album art displays
- [ ] No console errors

## Risk Assessment
**Risk Level:** Low

**Why:**
- Single line change (add conversion logic)
- No changes to LiveStore schema
- No changes to Redux reducers
- Only affects PlayerContainer data transformation

**Rollback:**
- Simply revert the change to `PlayerContainer.tsx`
